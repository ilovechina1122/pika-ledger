<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Category, TxType } from '@shared/types'
import type { AppInfo } from '@shared/types'
import type { CategoryWithCount } from '@shared/ipc'
import { useCategoriesStore } from '../stores/categories'
import { unwrap } from '../api'
import CategoryFormDialog from '../components/CategoryFormDialog.vue'

const store = useCategoriesStore()
const appInfo = ref<AppInfo | null>(null)

// 弹窗状态：type + 所属大类（新建）或 被编辑的分类（重命名）
const formVisible = ref(false)
const formType = ref<TxType>('expense')
const formParentId = ref<number | null>(null)
const formParentName = ref('')
const formEditing = ref<Category | null>(null)

const showHidden = ref(false)

onMounted(async () => {
  if (!store.loaded) await store.refresh()
  appInfo.value = await unwrap(window.api.app.getInfo())
})

const groups = computed(() => {
  const tops = store.topLevel
  return [
    { label: '支出', emoji: '💸', items: tops.filter((c) => c.type === 'expense') },
    { label: '收入', emoji: '💰', items: tops.filter((c) => c.type === 'income') }
  ]
})

const hiddenList = computed(() => store.list.filter((c) => c.isHidden))

// 一级大类的合计笔数（含其小类）
function topTxCount(top: CategoryWithCount): number {
  const subs = store.childrenOf.get(top.id) ?? []
  return top.txCount + subs.reduce((s, c) => s + c.txCount, 0)
}

function openCreateTop(type: TxType): void {
  formType.value = type
  formParentId.value = null
  formParentName.value = ''
  formEditing.value = null
  formVisible.value = true
}

function openCreateSub(parent: Category): void {
  formType.value = parent.type
  formParentId.value = parent.id
  formParentName.value = parent.name
  formEditing.value = null
  formVisible.value = true
}

function openRename(cat: Category): void {
  formType.value = cat.type
  formParentId.value = cat.parentId
  formParentName.value = ''
  formEditing.value = cat
  formVisible.value = true
}

async function onSaved(): Promise<void> {
  await store.refresh()
}

async function confirmDelete(cat: Category): Promise<void> {
  const isTop = cat.parentId === null
  try {
    await ElMessageBox.confirm(
      isTop
        ? `确定删除「${cat.name}」及其全部小类吗？删除后记一笔里将选不到它们，历史账单不受影响，随时可以恢复。`
        : `确定删除「${cat.name}」吗？删除后记一笔里将选不到它，历史账单不受影响，随时可以恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  try {
    await unwrap(window.api.categories.delete(cat.id))
    ElMessage.success('已删除（可恢复）')
    await store.refresh()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '删除失败')
  }
}

async function restore(cat: Category): Promise<void> {
  try {
    await unwrap(window.api.categories.restore(cat.id))
    ElMessage.success('已恢复 🐾')
    await store.refresh()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '恢复失败')
  }
}

async function openDataFolder(): Promise<void> {
  await unwrap(window.api.app.openDataFolder())
}
</script>

<template>
  <section class="view">
    <h1 class="view-title">🗂️ 分类管理</h1>
    <p class="view-desc">分类可以增删改；删除不影响历史账单，随时能恢复 🐾</p>

    <div v-for="g in groups" :key="g.label" class="group-card">
      <div class="group-head">
        <h2 class="group-title">{{ g.emoji }} {{ g.label }} · {{ g.items.length }} 个分类</h2>
        <button class="pika-btn small" @click="openCreateTop(g.items[0]?.type ?? 'expense')">
          ➕ 新增大类
        </button>
      </div>

      <div v-for="top in g.items" :key="top.id" class="cat-block">
        <div class="cat-row top-row">
          <span class="cat-emoji">{{ top.emoji }}</span>
          <span class="cat-name">{{ top.name }}</span>
          <span class="cat-count">{{ topTxCount(top) }} 笔</span>
          <div class="cat-actions">
            <button class="mini-btn" title="新增小类" @click="openCreateSub(top)">➕</button>
            <button class="mini-btn" title="重命名" @click="openRename(top)">✏️</button>
            <button class="mini-btn" title="删除" @click="confirmDelete(top)">🗑️</button>
          </div>
        </div>
        <div
          v-for="sub in store.childrenOf.get(top.id) ?? []"
          :key="sub.id"
          class="cat-row sub-row"
        >
          <span class="sub-dot" />
          <span class="cat-name">{{ sub.name }}</span>
          <span class="cat-count">{{ sub.txCount }} 笔</span>
          <div class="cat-actions">
            <button class="mini-btn" title="重命名" @click="openRename(sub)">✏️</button>
            <button class="mini-btn" title="删除" @click="confirmDelete(sub)">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <div class="hidden-card">
      <button class="hidden-toggle" @click="showHidden = !showHidden">
        {{ showHidden ? '收起' : '查看' }}已删除的分类（{{ hiddenList.length }}）
      </button>
      <div v-if="showHidden && hiddenList.length > 0" class="hidden-list">
        <div v-for="c in hiddenList" :key="c.id" class="cat-row">
          <span class="cat-emoji">{{ c.emoji }}</span>
          <span class="cat-name">{{ c.name }}</span>
          <span class="cat-count">{{ c.parentId === null ? '大类' : '小类' }}</span>
          <div class="cat-actions">
            <button class="mini-btn restore-btn" title="恢复" @click="restore(c)">↩️ 恢复</button>
          </div>
        </div>
      </div>
    </div>

    <div class="data-footer">
      <div class="data-path">📁 数据保存在：{{ appInfo?.dataDir ?? '加载中…' }}</div>
      <button class="pika-btn small" @click="openDataFolder">打开数据文件夹</button>
    </div>

    <CategoryFormDialog
      v-model:visible="formVisible"
      :type="formType"
      :parent-id="formParentId"
      :parent-name="formParentName"
      :editing="formEditing"
      @saved="onSaved"
    />
  </section>
</template>

<style scoped>
.pika-btn.small {
  padding: 6px 16px;
  font-size: 13px;
}

.group-card {
  margin-top: 16px;
  padding: 18px 20px;
  background: var(--pika-card);
  border: 1px solid var(--pika-hairline);
  border-radius: var(--pika-radius);
  box-shadow: var(--pika-shadow);
}

.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.group-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
}

.cat-block {
  margin-top: 6px;
  padding: 8px 10px;
  background: var(--pika-cream);
  border-radius: 14px;
}

.cat-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
  border-radius: 10px;
}

.cat-row:hover {
  background: var(--pika-card);
}

.top-row {
  font-weight: 700;
}

.sub-row {
  padding-left: 34px;
  font-weight: 400;
}

.sub-dot {
  width: 5px;
  height: 5px;
  flex-shrink: 0;
  background: var(--pika-muted);
  border-radius: 999px;
}

.cat-emoji {
  font-size: 18px;
}

.cat-name {
  flex: 1;
  font-size: 14px;
}

.cat-count {
  font-size: 12px;
  color: var(--pika-muted);
  font-variant-numeric: tabular-nums;
}

.cat-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.cat-row:hover .cat-actions {
  opacity: 1;
}

.mini-btn {
  padding: 4px 8px;
  font-size: 13px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.mini-btn:hover {
  background: var(--pika-yellow);
}

.mini-btn.restore-btn {
  color: var(--pika-income);
  font-size: 12px;
  font-weight: 600;
}

.hidden-card {
  margin-top: 16px;
  padding: 14px 20px;
  background: var(--pika-card);
  border: 1px dashed var(--pika-hairline);
  border-radius: var(--pika-radius);
}

.hidden-toggle {
  font-size: 13px;
  color: var(--pika-muted);
  background: transparent;
  border: none;
  cursor: pointer;
}

.hidden-toggle:hover {
  color: var(--pika-ink);
}

.hidden-list {
  margin-top: 10px;
  background: var(--pika-cream);
  border-radius: 14px;
  padding: 4px 8px;
}

.data-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  padding: 14px 20px;
  background: var(--pika-card);
  border: 1px solid var(--pika-hairline);
  border-radius: var(--pika-radius);
}

.data-path {
  font-size: 12px;
  color: var(--pika-muted);
  word-break: break-all;
}
</style>
