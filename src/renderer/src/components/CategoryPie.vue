<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import VChart from 'vue-echarts'
import type { ComposeOption } from 'echarts/core'
import type { PieSeriesOption } from 'echarts/charts'
import type { LegendComponentOption, TooltipComponentOption } from 'echarts/components'
import type { CategoryBreakdownRow } from '@shared/ipc'
import type { TxType } from '@shared/types'
import { unwrap } from '../api'
import { formatYuan } from '../utils/money'
import { PIE_COLORS } from '../charts/palette'
import '../charts/setup'

type PieOption = ComposeOption<PieSeriesOption | LegendComponentOption | TooltipComponentOption>

const props = defineProps<{ month: string; type: TxType }>()

const rows = ref<CategoryBreakdownRow[]>([])
// 下钻状态：非空表示正在展示某个大类的二级构成
const drillId = ref<number | null>(null)
const drillName = ref('')

async function load(): Promise<void> {
  rows.value = await unwrap(window.api.stats.categoryBreakdown(props.month, props.type, drillId.value))
}

onMounted(load)
watch(
  () => [props.month, props.type],
  () => {
    drillId.value = null
    drillName.value = ''
    void load()
  }
)

const option = computed<PieOption>(() => {
  const top8 = rows.value.slice(0, 8)
  const rest = rows.value.slice(8)
  const data = top8.map((r) => ({ name: r.categoryName, value: r.amountCents }))
  // 第 9 名及以后并入「其他」
  if (rest.length > 0) {
    data.push({ name: '其他', value: rest.reduce((s, r) => s + r.amountCents, 0) })
  }
  return {
    color: PIE_COLORS,
    tooltip: {
      trigger: 'item',
      formatter: (raw) => {
        const p = raw as unknown as {
          marker?: string
          name: string
          value: unknown
          percent?: number
        }
        const value = Math.round(Number(p.value))
        const percent = typeof p.percent === 'number' ? p.percent.toFixed(1) : '0.0'
        return `${p.marker ?? ''}${p.name}：¥${formatYuan(value)}（${percent}%）`
      }
    },
    legend: {
      bottom: 0,
      left: 'center',
      icon: 'circle',
      itemWidth: 10,
      textStyle: { color: '#2b2724', fontSize: 12 }
    },
    series: [
      {
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '40%'],
        itemStyle: { borderColor: '#fffdf9', borderWidth: 2, borderRadius: 6 },
        label: { formatter: '{b}\n{d}%', color: '#a49a8c', fontSize: 11 },
        labelLine: { length: 10, length2: 8 },
        data
      }
    ]
  }
})

// 点击扇区下钻到该大类的二级构成
function onClick(params: { name: string }): void {
  if (drillId.value !== null || params.name === '其他') return
  const row = rows.value.find((r) => r.categoryName === params.name)
  if (row) {
    drillId.value = row.categoryId
    drillName.value = row.categoryName
    void load()
  }
}

function back(): void {
  drillId.value = null
  drillName.value = ''
  void load()
}
</script>

<template>
  <div class="pie-wrap">
    <div v-if="drillId !== null" class="drill-bar">
      <button class="back-btn" @click="back">← 返回总览</button>
      <span class="drill-name">{{ drillName }}</span>
    </div>
    <v-chart v-if="rows.length > 0" class="chart" :option="option" autoresize @click="onClick" />
    <p v-else class="pie-empty">本月暂无{{ type === 'expense' ? '支出' : '收入' }} 🐾</p>
  </div>
</template>

<style scoped>
.drill-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
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

.drill-name {
  font-size: 14px;
  font-weight: 700;
}

.chart {
  height: 280px;
}

.pie-empty {
  height: 280px;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--pika-muted);
}
</style>
