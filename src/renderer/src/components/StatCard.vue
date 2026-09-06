<script setup lang="ts">
import { formatSignedYuan } from '../utils/money'

defineProps<{ label: string; emoji: string; amountCents: number; tone: 'expense' | 'income' | 'balance' }>()
</script>

<template>
  <div class="stat-card">
    <div class="stat-label">{{ emoji }} {{ label }}</div>
    <div class="stat-value" :class="`tone-${tone}`">{{ formatSignedYuan(amountCents) }}</div>
  </div>
</template>

<style scoped>
.stat-card {
  padding: 18px 20px;
  background: var(--pika-card);
  border: 1px solid var(--pika-hairline);
  border-radius: var(--pika-radius);
  box-shadow: var(--pika-shadow);
}

.stat-label {
  font-size: 13px;
  color: var(--pika-muted);
}

.stat-value {
  margin-top: 8px;
  font-size: 26px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.tone-expense {
  color: var(--pika-expense);
}

.tone-income {
  color: var(--pika-income);
}

.tone-balance {
  color: var(--pika-ink);
}
</style>
