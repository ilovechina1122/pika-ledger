<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElDialog, ElMessage } from 'element-plus'
import type { Category, TxType } from '@shared/types'
import { unwrap } from '../api'

const props = defineProps<{
  visible: boolean
  type: TxType
  // 新建模式：parentId 为空表示新增大类，非空表示在某个大类下新增小类
  parentId: number | null
  parentName: string
  // 重命名模式：非空表示编辑已有分类
  editing: Category | null
}>()
const emit = defineEmits<{ 'update:visible': [value: boolean]; saved: [] }>()

const name = ref('')
const emoji = ref('')
const saving = ref(false)

const EMOJI_PRESETS = [
  '🍜', '🚌', '🛍️', '🏠', '🎮', '💊', '📚', '🧧', '🐕', '📦',
  '💰', '💼', '📈', '🧾', '🎁', '🐾', '☕', '🎬', '✈️', '🛒'
]

const title = computed(() => {
  if (props.editing) return '✏️ 重命名分类'
  if (props.parentId !== null) return `➕ 新增小类（${props.parentName}）`
  return `➕ 新增${props.type === 'expense' ? '支出' : '收入'}大类`
})

// 打开时填充表单
watch(
  () => props.visible,
  (v) => {
    if (v) {
      name.value = props.editing?.name ?? ''
      emoji.value = props.editing?.emoji ?? ''
    }
  }
)

async function save(): Promise<void> {
  if (!name.value.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }
  saving.value = true
  try {
    if (props.editing) {
      await unwrap(
        window.api.categories.rename({
          id: props.editing.id,
          name: name.value,
          emoji: emoji.value || undefined
        })
      )
    } else {
      await unwrap(
        window.api.categories.create({
          name: name.value,
          type: props.type,
          parentId: props.parentId,
          emoji: emoji.value || undefined
        })
      )
    }
    ElMessage.success('已保存 🐾')
    emit('update:visible', false)
    emit('saved')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    width="420px"
    align-center
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="cat-form">
      <div class="form-label">名称</div>
      <input
        v-model="name"
        class="name-input"
        type="text"
        maxlength="10"
        placeholder="最多 10 个字"
        @keydown.enter="save"
      />

      <div class="form-label">图标（可选）</div>
      <div class="emoji-grid">
        <button
          v-for="e in EMOJI_PRESETS"
          :key="e"
          class="emoji-chip"
          :class="{ selected: emoji === e }"
          @click="emoji = emoji === e ? '' : e"
        >
          {{ e }}
        </button>
      </div>
    </div>

    <template #footer>
      <button class="pika-btn" :disabled="saving" @click="save">
        {{ saving ? '保存中…' : '保存' }}
      </button>
    </template>
  </el-dialog>
</template>

<style scoped>
.cat-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--pika-muted);
}

.name-input {
  box-sizing: border-box;
  width: 100%;
  padding: 9px 14px;
  font-size: 14px;
  color: var(--pika-ink);
  background: var(--pika-cream);
  border: 1px solid var(--pika-hairline);
  border-radius: 12px;
  outline: none;
  transition: border-color 0.15s ease;
}

.name-input:focus {
  border-color: var(--pika-yellow);
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 6px;
}

.emoji-chip {
  padding: 7px 0;
  font-size: 18px;
  background: var(--pika-cream);
  border: 2px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.emoji-chip:hover {
  border-color: var(--pika-yellow);
}

.emoji-chip.selected {
  background: var(--pika-yellow);
  border-color: var(--pika-yellow);
}
</style>
