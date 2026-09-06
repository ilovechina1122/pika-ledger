<script setup lang="ts">
import type { TransactionRecord } from '@shared/types'
import { formatYuan } from '../utils/money'

defineProps<{ record: TransactionRecord }>()
const emit = defineEmits<{ edit: []; remove: [] }>()
</script>

<template>
  <div class="record-row">
    <span class="row-emoji">{{ record.categoryEmoji }}</span>
    <div class="row-main">
      <div class="row-name">{{ record.categoryName }}</div>
      <div v-if="record.note" class="row-note">{{ record.note }}</div>
    </div>
    <div class="row-amount" :class="record.type === 'expense' ? 'is-expense' : 'is-income'">
      {{ record.type === 'expense' ? '-' : '+' }}¥{{ formatYuan(record.amountCents) }}
    </div>
    <div class="row-actions">
      <button class="row-btn" title="编辑" @click="emit('edit')">✏️</button>
      <button class="row-btn" title="删除" @click="emit('remove')">🗑️</button>
    </div>
  </div>
</template>

<style scoped>
.record-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 14px;
  transition: background 0.15s ease;
}

.record-row:hover {
  background: var(--pika-cream);
}

.row-emoji {
  font-size: 22px;
}

.row-main {
  flex: 1;
  min-width: 0;
}

.row-name {
  font-size: 14px;
  font-weight: 600;
}

.row-note {
  margin-top: 2px;
  font-size: 12px;
  color: var(--pika-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-amount {
  font-size: 15px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.row-amount.is-expense {
  color: var(--pika-expense);
}

.row-amount.is-income {
  color: var(--pika-income);
}

.row-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.record-row:hover .row-actions {
  opacity: 1;
}

.row-btn {
  padding: 5px 8px;
  font-size: 13px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.row-btn:hover {
  background: var(--pika-yellow);
}
</style>
