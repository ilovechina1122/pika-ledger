<script setup lang="ts">
import { ElDatePicker, ElSelect, ElOption } from 'element-plus'
import type { TxType } from '@shared/types'
import { useCategoriesStore } from '../stores/categories'

const store = useCategoriesStore()

const typeFilter = defineModel<'all' | TxType>('typeFilter', { required: true })
const dateRange = defineModel<[string, string] | null>('dateRange', { required: true })
const topCategoryId = defineModel<number | null>('topCategoryId', { required: true })
const keyword = defineModel<string>('keyword', { required: true })
</script>

<template>
  <div class="filter-bar">
    <div class="type-seg">
      <button
        v-for="opt in [
          { v: 'all', label: '全部' },
          { v: 'expense', label: '支出' },
          { v: 'income', label: '收入' }
        ]"
        :key="opt.v"
        class="seg-btn"
        :class="{ active: typeFilter === opt.v }"
        @click="typeFilter = opt.v as 'all' | TxType"
      >
        {{ opt.label }}
      </button>
    </div>

    <el-date-picker
      v-model="dateRange"
      type="daterange"
      value-format="YYYY-MM-DD"
      format="YYYY年MM月DD日"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      style="width: 250px"
    />

    <el-select v-model="topCategoryId" placeholder="全部分类" clearable style="width: 150px">
      <el-option
        v-for="c in store.topLevel"
        :key="c.id"
        :value="c.id"
        :label="`${c.emoji} ${c.name}`"
      />
    </el-select>

    <input
      v-model="keyword"
      class="keyword-input"
      type="text"
      placeholder="🔍 搜索备注"
      maxlength="50"
    />
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
  padding: 12px 14px;
  background: var(--pika-card);
  border: 1px solid var(--pika-hairline);
  border-radius: 16px;
  box-shadow: var(--pika-shadow);
}

.type-seg {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  background: var(--pika-cream);
  border-radius: 999px;
}

.seg-btn {
  padding: 6px 16px;
  font-size: 13px;
  color: var(--pika-muted);
  background: transparent;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.seg-btn.active {
  color: var(--pika-card);
  background: var(--pika-ink);
  font-weight: 600;
}

.keyword-input {
  flex: 1;
  min-width: 140px;
  padding: 7px 14px;
  font-size: 13px;
  color: var(--pika-ink);
  background: var(--pika-cream);
  border: 1px solid var(--pika-hairline);
  border-radius: 999px;
  outline: none;
  transition: border-color 0.15s ease;
}

.keyword-input:focus {
  border-color: var(--pika-yellow);
}
</style>
