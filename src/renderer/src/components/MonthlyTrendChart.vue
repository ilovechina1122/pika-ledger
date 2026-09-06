<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import VChart from 'vue-echarts'
import type { ComposeOption } from 'echarts/core'
import type { LineSeriesOption } from 'echarts/charts'
import type { GridComponentOption, LegendComponentOption, TooltipComponentOption } from 'echarts/components'
import type { MonthTrendRow } from '@shared/ipc'
import { unwrap } from '../api'
import { EXPENSE_COLOR, INCOME_COLOR } from '../charts/palette'
import '../charts/setup'

type LineOption = ComposeOption<
  LineSeriesOption | GridComponentOption | LegendComponentOption | TooltipComponentOption
>

const props = defineProps<{ fromMonth: string; toMonth: string }>()

const rows = ref<MonthTrendRow[]>([])

async function load(): Promise<void> {
  rows.value = await unwrap(window.api.stats.monthlyTrend(props.fromMonth, props.toMonth))
}

onMounted(load)
watch(() => [props.fromMonth, props.toMonth], load)

const option = computed<LineOption>(() => {
  const months: string[] = []
  let cur = dayjs(props.fromMonth)
  while (!cur.isAfter(dayjs(props.toMonth), 'month')) {
    months.push(cur.format('YYYY-MM'))
    cur = cur.add(1, 'month')
  }
  const map = new Map(rows.value.map((r) => [r.month, r]))

  return {
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) => `¥${Number(v).toFixed(2)}`
    },
    legend: {
      top: 0,
      right: 0,
      data: ['支出', '收入'],
      icon: 'circle',
      itemWidth: 10,
      textStyle: { color: '#3d2e1e', fontSize: 12 }
    },
    grid: { left: 8, right: 8, top: 36, bottom: 0, containLabel: true },
    xAxis: {
      type: 'category',
      data: months.map((m) => dayjs(m).format('YY年M月')),
      boundaryGap: false,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e8e2d3' } },
      axisLabel: { color: '#a0978a', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#e8e2d3' } },
      axisLabel: { color: '#a0978a', fontSize: 11 }
    },
    series: [
      {
        name: '支出',
        type: 'line',
        data: months.map((m) => (map.get(m)?.expense ?? 0) / 100),
        lineStyle: { width: 2 },
        itemStyle: { color: EXPENSE_COLOR },
        symbol: 'circle',
        symbolSize: 7
      },
      {
        name: '收入',
        type: 'line',
        data: months.map((m) => (map.get(m)?.income ?? 0) / 100),
        lineStyle: { width: 2 },
        itemStyle: { color: INCOME_COLOR },
        symbol: 'circle',
        symbolSize: 7
      }
    ]
  }
})
</script>

<template>
  <v-chart class="chart" :option="option" autoresize />
</template>

<style scoped>
.chart {
  height: 260px;
}
</style>
