<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import type { CategoryBreakdownRow, MonthSummary } from '@shared/ipc'
import { unwrap } from '../api'
import MonthSwitcher from '../components/MonthSwitcher.vue'
import StatCard from '../components/StatCard.vue'
import CategoryPie from '../components/CategoryPie.vue'
import DailyBarChart from '../components/DailyBarChart.vue'
import MonthlyTrendChart from '../components/MonthlyTrendChart.vue'
import RankingList from '../components/RankingList.vue'
import EmptyState from '../components/EmptyState.vue'

const month = ref(dayjs().format('YYYY-MM'))
const summary = ref<MonthSummary>({ income: 0, expense: 0, balance: 0 })
const expenseBreakdown = ref<CategoryBreakdownRow[]>([])
const incomeBreakdown = ref<CategoryBreakdownRow[]>([])
const loading = ref(true)

async function load(): Promise<void> {
  loading.value = true
  try {
    summary.value = await unwrap(window.api.stats.monthSummary(month.value))
    expenseBreakdown.value = await unwrap(
      window.api.stats.categoryBreakdown(month.value, 'expense')
    )
    incomeBreakdown.value = await unwrap(
      window.api.stats.categoryBreakdown(month.value, 'income')
    )
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(month, load)

const isEmpty = computed(() => summary.value.income === 0 && summary.value.expense === 0)
const trendFrom = computed(() => dayjs(month.value).subtract(11, 'month').format('YYYY-MM'))
</script>

<template>
  <section class="view stats-view">
    <div class="stats-head">
      <h1 class="view-title">📊 统计</h1>
      <MonthSwitcher v-model:month="month" />
    </div>

    <div class="stat-cards">
      <StatCard label="收入" emoji="💰" :amount-cents="summary.income" tone="income" />
      <StatCard label="支出" emoji="💸" :amount-cents="summary.expense" tone="expense" />
      <StatCard label="结余" emoji="🏦" :amount-cents="summary.balance" tone="balance" />
    </div>

    <p v-if="loading" class="view-desc" style="margin-top: 24px">加载中…</p>

    <template v-else-if="isEmpty">
      <EmptyState text="这个月还没有账，去记一笔吧～" />
    </template>

    <template v-else>
      <div class="chart-card">
        <h2 class="card-title">每日收支</h2>
        <DailyBarChart :month="month" />
      </div>

      <div class="chart-card">
        <h2 class="card-title">近 12 个月趋势</h2>
        <MonthlyTrendChart :from-month="trendFrom" :to-month="month" />
      </div>

      <div class="pie-grid">
        <div class="chart-card">
          <h2 class="card-title">💸 支出构成（点击扇区看小类）</h2>
          <CategoryPie :month="month" type="expense" />
          <RankingList :rows="expenseBreakdown" />
        </div>
        <div class="chart-card">
          <h2 class="card-title">💰 收入构成（点击扇区看小类）</h2>
          <CategoryPie :month="month" type="income" />
          <RankingList :rows="incomeBreakdown" />
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.stats-view {
  max-width: 980px;
}

.stats-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.stats-head .view-title {
  margin: 0;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.chart-card {
  margin-top: 16px;
  padding: 18px 20px;
  background: var(--pika-card);
  border: 1px solid var(--pika-hairline);
  border-radius: var(--pika-radius);
  box-shadow: var(--pika-shadow);
}

.card-title {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 700;
}

.pie-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 1024px) {
  .pie-grid {
    grid-template-columns: 1fr;
  }
}
</style>
