<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { TxType } from '@shared/types'
import { useCategoriesStore } from '../stores/categories'

const props = defineProps<{ type: TxType; modelValue: number | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()

const store = useCategoriesStore()

// 当前展开的大类 id；null 表示还在"先选大类"这一层
const selectedTopId = ref<number | null>(null)

const topLevels = computed(() => store.topLevel.filter((c) => c.type === props.type))

const selectedTop = computed(() => topLevels.value.find((c) => c.id === selectedTopId.value) ?? null)

// 切换收支类型 / 分类数据加载完成时，把选中分类所属的大类展开
watch(
  () => [props.type, store.loaded, props.modelValue] as const,
  () => {
    if (props.modelValue === null) return
    const cat = store.list.find((c) => c.id === props.modelValue)
    if (cat && cat.parentId !== null) selectedTopId.value = cat.parentId
  },
  { immediate: true }
)

function pickTop(id: number): void {
  selectedTopId.value = id
  emit('update:modelValue', null)
}

function pickChild(catId: number): void {
  emit('update:modelValue', catId)
}

function back(): void {
  selectedTopId.value = null
}
</script>

<template>
  <div class="cat-picker">
    <!-- 第一层：选大类 -->
    <template v-if="!selectedTop">
      <div class="picker-hint">先选大类</div>
      <div class="top-grid">
        <button v-for="c in topLevels" :key="c.id" class="top-chip" @click="pickTop(c.id)">
          <span class="chip-emoji">{{ c.emoji }}</span>
          <span>{{ c.name }}</span>
        </button>
      </div>
    </template>

    <!-- 第二层：选小类 -->
    <template v-else>
      <div class="picker-breadcrumb">
        <button class="back-btn" @click="back">← 返回</button>
        <span class="crumb">{{ selectedTop.emoji }} {{ selectedTop.name }}</span>
      </div>
      <div class="sub-grid">
        <button
          v-for="c in store.childrenOf.get(selectedTop.id) ?? []"
          :key="c.id"
          class="sub-chip"
          :class="{ selected: modelValue === c.id }"
          @click="pickChild(c.id)"
        >
          {{ c.name }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.picker-hint {
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--pika-muted);
}

.top-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 8px;
}

.top-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--pika-ink);
  background: var(--pika-cream);
  border: 2px solid transparent;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.top-chip:hover {
  border-color: var(--pika-yellow);
  background: var(--pika-card);
}

.chip-emoji {
  font-size: 22px;
}

.picker-breadcrumb {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.back-btn {
  padding: 5px 12px;
  font-size: 13px;
  color: var(--pika-muted);
  background: var(--pika-cream);
  border: none;
  border-radius: 999px;
  cursor: pointer;
}

.back-btn:hover {
  color: var(--pika-ink);
}

.crumb {
  font-size: 14px;
  font-weight: 700;
}

.sub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 8px;
}

.sub-chip {
  padding: 10px 8px;
  font-size: 13px;
  color: var(--pika-ink);
  background: var(--pika-cream);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sub-chip:hover {
  border-color: var(--pika-yellow);
}

.sub-chip.selected {
  color: var(--pika-ink);
  background: var(--pika-yellow);
  border-color: var(--pika-yellow);
  font-weight: 600;
}
</style>
