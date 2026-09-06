<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'

const props = defineProps<{ month: string }>()
const emit = defineEmits<{ 'update:month': [value: string] }>()

const label = computed(() => dayjs(props.month).format('YYYY年M月'))
const canGoNext = computed(() => !dayjs(props.month).isSame(dayjs(), 'month'))

function prev(): void {
  emit('update:month', dayjs(props.month).subtract(1, 'month').format('YYYY-MM'))
}

function next(): void {
  if (canGoNext.value) emit('update:month', dayjs(props.month).add(1, 'month').format('YYYY-MM'))
}
</script>

<template>
  <div class="month-switcher">
    <button class="ms-btn" @click="prev">‹</button>
    <span class="ms-label">{{ label }}</span>
    <button class="ms-btn" :disabled="!canGoNext" @click="next">›</button>
  </div>
</template>

<style scoped>
.month-switcher {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px;
  background: var(--pika-card);
  border: 1px solid var(--pika-hairline);
  border-radius: 999px;
  box-shadow: var(--pika-shadow);
}

.ms-btn {
  width: 32px;
  height: 32px;
  font-size: 18px;
  line-height: 1;
  color: var(--pika-ink);
  background: var(--pika-cream);
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.ms-btn:hover:not(:disabled) {
  background: var(--pika-yellow);
}

.ms-btn:disabled {
  color: var(--pika-hairline);
  cursor: not-allowed;
}

.ms-label {
  min-width: 88px;
  font-size: 15px;
  font-weight: 700;
  text-align: center;
}
</style>
