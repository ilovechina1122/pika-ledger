<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { TransactionRecord, TxType } from '@shared/types'
import { useCategoriesStore } from '../stores/categories'
import { unwrap } from '../api'
import { dateGroupLabel } from '../utils/date'
import FilterBar from '../components/FilterBar.vue'
import RecordRow from '../components/RecordRow.vue'
import DateGroupHeader from '../components/DateGroupHeader.vue'
import RecordFormDialog from '../components/RecordFormDialog.vue'
import EmptyState from '../components/EmptyState.vue'

const store = useCategoriesStore()

const typeFilter = ref<'all' | TxType>('all')
const dateRange = ref<[string, string] | null>(null)
const topCategoryId = ref<number | null>(null)
const keyword = ref('')

const records = ref<TransactionRecord[]>([])
const loading = ref(true)
const editVisible = ref(false)
const editing = ref<TransactionRecord | null>(null)

onMounted(() => {
  if (!store.loaded) void store.refresh()
  void load()
})

async function load(): Promise<void> {
  loading.value = true
  try {
    records.value = await unwrap(
      window.api.records.list({
        type: typeFilter.value === 'all' ? undefined : typeFilter.value,
        startDate: dateRange.value?.[0] ?? undefined,
        endDate: dateRange.value?.[1] ?? undefined,
        categoryId: topCategoryId.value ?? undefined,
        noteKeyword: keyword.value.trim() || undefined
      })
    )
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '加载失败')
  } finally {
    loading.value = false
  }
}

watch([typeFilter, dateRange, topCategoryId, keyword], () => {
  void load()
})

interface DayGroup {
  date: string
  label: string
  items: TransactionRecord[]
  expenseSum: number
  incomeSum: number
}

// 按日期分组（接口已按日期倒序返回，Map 保序）
const groups = computed<DayGroup[]>(() => {
  const map = new Map<string, DayGroup>()
  for (const r of records.value) {
    let g = map.get(r.date)
    if (!g) {
      g = { date: r.date, label: dateGroupLabel(r.date), items: [], expenseSum: 0, incomeSum: 0 }
      map.set(r.date, g)
    }
    g.items.push(r)
    if (r.type === 'expense') g.expenseSum += r.amountCents
    else g.incomeSum += r.amountCents
  }
  return [...map.values()]
})

function openEdit(record: TransactionRecord): void {
  editing.value = record
  editVisible.value = true
}

async function confirmRemove(record: TransactionRecord): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确定删除「${record.categoryName} ¥${(record.amountCents / 100).toFixed(2)}」这笔账吗？删除后无法恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch {
    return // 用户取消
  }
  try {
    await unwrap(window.api.records.delete(record.id))
    ElMessage.success('已删除')
    await load()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '删除失败')
  }
}
</script>

<template>
  <section class="view">
    <h1 class="view-title">📒 账单</h1>
    <p class="view-desc">每一笔，都算数 🐾</p>

    <FilterBar
      v-model:type-filter="typeFilter"
      v-model:date-range="dateRange"
      v-model:top-category-id="topCategoryId"
      v-model:keyword="keyword"
    />

    <p v-if="loading" class="view-desc" style="margin-top: 24px">加载中…</p>

    <template v-else>
      <EmptyState v-if="records.length === 0" />
      <div v-for="g in groups" v-else :key="g.date">
        <DateGroupHeader :label="g.label" :expense-sum="g.expenseSum" :income-sum="g.incomeSum" />
        <div class="group-card">
          <RecordRow
            v-for="r in g.items"
            :key="r.id"
            :record="r"
            @edit="openEdit(r)"
            @remove="confirmRemove(r)"
          />
        </div>
      </div>
    </template>

    <RecordFormDialog v-model:visible="editVisible" :record="editing" @saved="load" />
  </section>
</template>

<style scoped>
.group-card {
  padding: 6px;
  background: var(--pika-card);
  border: 1px solid var(--pika-hairline);
  border-radius: var(--pika-radius);
  box-shadow: var(--pika-shadow);
}
</style>
