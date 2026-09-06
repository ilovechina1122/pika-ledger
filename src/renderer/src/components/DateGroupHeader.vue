<script setup lang="ts">
import { formatYuan } from '../utils/money'

defineProps<{ label: string; expenseSum: number; incomeSum: number }>()
</script>

<template>
  <div class="day-header">
    <span class="day-label">{{ label }}</span>
    <span class="day-sum">
      <span v-if="expenseSum > 0" class="sum-expense">支出 ¥{{ formatYuan(expenseSum) }}</span>
      <span v-if="incomeSum > 0" class="sum-income">收入 ¥{{ formatYuan(incomeSum) }}</span>
    </span>
  </div>
</template>

<style scoped>
.day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 18px 2px 8px;
}

.day-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--pika-muted);
}

.day-sum {
  display: flex;
  gap: 12px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.sum-expense {
  color: var(--pika-expense);
}

.sum-income {
  color: var(--pika-income);
}
</style>
