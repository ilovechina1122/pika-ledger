<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { AppInfo } from '@shared/types'
import { useCategoriesStore } from '../stores/categories'
import { unwrap } from '../api'

const store = useCategoriesStore()
const appInfo = ref<AppInfo | null>(null)

onMounted(async () => {
  await store.refresh()
  appInfo.value = await unwrap(window.api.app.getInfo())
})

const groups = computed(() => {
  const tops = store.topLevel
  return [
    { label: '支出', emoji: '💸', items: tops.filter((c) => c.type === 'expense') },
    { label: '收入', emoji: '💰', items: tops.filter((c) => c.type === 'income') }
  ]
})

async function openDataFolder(): Promise<void> {
  await unwrap(window.api.app.openDataFolder())
}
</script>

<template>
  <section class="view">
    <h1 class="view-title">🗂️ 分类管理</h1>
    <p class="view-desc">内置分类已自动就绪；分类的增删改将在后续版本开放 🐾</p>

    <div v-for="g in groups" :key="g.label" class="group-card">
      <h2 class="group-title">{{ g.emoji }} {{ g.label }} · {{ g.items.length }} 个分类</h2>
      <div class="group-grid">
        <div v-for="item in g.items" :key="item.id" class="cat-card">
          <span class="cat-emoji">{{ item.emoji }}</span>
          <div class="cat-body">
            <div class="cat-name">{{ item.name }}</div>
            <div class="cat-subs">
              {{ (store.childrenOf.get(item.id) ?? []).map((c) => c.name).join(' · ') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="data-footer">
      <div class="data-path">📁 数据保存在：{{ appInfo?.dataDir ?? '加载中…' }}</div>
      <button class="pika-btn" @click="openDataFolder">打开数据文件夹</button>
    </div>
  </section>
</template>

<style scoped>
.group-card {
  margin-top: 18px;
  padding: 20px 22px;
  background: var(--pika-card);
  border: 1px solid var(--pika-hairline);
  border-radius: var(--pika-radius);
  box-shadow: var(--pika-shadow);
}

.group-title {
  margin: 0 0 14px;
  font-size: 16px;
  font-weight: 700;
}

.group-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.cat-card {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  background: var(--pika-cream);
  border-radius: 16px;
}

.cat-emoji {
  font-size: 22px;
  line-height: 1.4;
}

.cat-name {
  font-size: 14px;
  font-weight: 600;
}

.cat-subs {
  margin-top: 3px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--pika-muted);
}

.data-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 22px;
  padding: 16px 20px;
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
