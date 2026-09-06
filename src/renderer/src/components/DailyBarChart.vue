<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import VChart from 'vue-echarts'
import type { ComposeOption } from 'echarts/core'
import type { BarSeriesOption } from 'echarts/charts'
import type { GridComponentOption, LegendComponentOption, TooltipComponentOption } from 'echarts/components'
import type { DaySeriesRow } from '@shared/ipc'
import { unwrap } from '../api'
import { EXPENSE_COLOR, INCOME_COLOR } from '../charts/palette'
import '../charts/setup'

type BarOption = ComposeOption<
  BarSeriesOption | GridComponentOption | LegendComponentOption | TooltipComponentOption
>

const props = defineProps<{ month: string }>()

const rows = ref<DaySeriesRow[]>([])

async function load(): Promise<void> {
  rows.value = await unwrap(window.api.stats.dailySeries(props.month))
}

onMounted(load)
watch(() => props.month, load)

const option = computed<BarOption>(() => {
  const days = dayjs(props.month).daysInMonth()
  const labels = Array.from({ length: days }, (_, i) => `${i + 1}日`)
  const map = new Map(rows.value.map((r) => [r.date, r]))
  const dayOf = (i: number): DaySeriesRow | undefined =>
    map.get(`${props.month}-${String(i + 1).padStart(2, '0')}`)

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
      data: labels,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e8e2d3' } },
      axisLabel: { color: '#a0978a', fontSize: 11, interval: 4 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#e8e2d3' } },
      axisLabel: { color: '#a0978a', fontSize: 11 }
    },
    series: [
      {
        name: '支出',
        type: 'bar',
        data: labels.map((_, i) => (dayOf(i)?.expense ?? 0) / 100),
        barMaxWidth: 12,
        barGap: '25%',
        itemStyle: { color: EXPENSE_COLOR, borderRadius: [3, 3, 0, 0] }
      },
      {
        name: '收入',
        type: 'bar',
        data: labels.map((_, i) => (dayOf(i)?.income ?? 0) / 100),
        barMaxWidth: 12,
        itemStyle: { color: INCOME_COLOR, borderRadius: [3, 3, 0, 0] }
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
