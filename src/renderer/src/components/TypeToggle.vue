<script setup lang="ts">
import type { TxType } from '@shared/types'

defineProps<{ modelValue: TxType }>()
const emit = defineEmits<{ 'update:modelValue': [value: TxType] }>()
</script>

<template>
  <div class="type-toggle">
    <button
      class="type-btn type-expense"
      :class="{ active: modelValue === 'expense' }"
      @click="emit('update:modelValue', 'expense')"
    >
      💸 支出
    </button>
    <button
      class="type-btn type-income"
      :class="{ active: modelValue === 'income' }"
      @click="emit('update:modelValue', 'income')"
    >
      💰 收入
    </button>
  </div>
</template>

<style scoped>
.type-toggle {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: var(--pika-cream);
  border-radius: 999px;
}

.type-btn {
  padding: 9px 26px;
  font-size: 15px;
  font-weight: 600;
  color: var(--pika-muted);
  background: transparent;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.type-btn.active.type-expense {
  color: #fff;
  background: var(--pika-expense);
}

.type-btn.active.type-income {
  color: #fff;
  background: var(--pika-income);
}
</style>
