<script setup lang="ts">
import type { CategoryBreakdownRow } from '@shared/ipc'
import { formatYuan } from '../utils/money'

defineProps<{ rows: CategoryBreakdownRow[] }>()
</script>

<template>
  <div class="ranking">
    <div v-for="(r, i) in rows.slice(0, 10)" :key="r.categoryId" class="rank-row">
      <span class="rank-no" :class="{ top: i < 3 }">{{ i + 1 }}</span>
      <span class="rank-emoji">{{ r.categoryEmoji }}</span>
      <div class="rank-main">
        <div class="rank-head">
          <span class="rank-name">{{ r.categoryName }}</span>
          <span class="rank-amount">¥{{ formatYuan(r.amountCents) }}</span>
        </div>
        <div class="rank-track">
          <div class="rank-bar" :style="{ width: `${Math.min(r.percent, 100)}%` }" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ranking {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rank-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rank-no {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--pika-muted);
  background: var(--pika-cream);
  border-radius: 8px;
  flex-shrink: 0;
}

.rank-no.top {
  color: var(--pika-ink);
  background: var(--pika-yellow);
}

.rank-emoji {
  font-size: 16px;
  flex-shrink: 0;
}

.rank-main {
  flex: 1;
  min-width: 0;
}

.rank-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.rank-name {
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-amount {
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.rank-track {
  margin-top: 4px;
  height: 6px;
  background: var(--pika-cream);
  border-radius: 999px;
  overflow: hidden;
}

.rank-bar {
  height: 100%;
  background: var(--pika-yellow);
  border-radius: 999px;
}
</style>
