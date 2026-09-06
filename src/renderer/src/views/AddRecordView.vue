<script setup lang="ts">
import { onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { ElMessage, ElDatePicker } from 'element-plus'
import type { TxType } from '@shared/types'
import { useCategoriesStore } from '../stores/categories'
import { unwrap } from '../api'
import AmountInput from '../components/AmountInput.vue'
import TypeToggle from '../components/TypeToggle.vue'
import CategoryPicker from '../components/CategoryPicker.vue'

const store = useCategoriesStore()

const amount = ref('')
const type = ref<TxType>('expense')
const categoryId = ref<number | null>(null)
const date = ref(dayjs().format('YYYY-MM-DD'))
const note = ref('')
const saving = ref(false)

onMounted(() => {
  if (!store.loaded) void store.refresh()
})

function amountToCents(v: string): number {
  return Math.round(parseFloat(v) * 100)
}

async function save(): Promise<void> {
  const cents = amountToCents(amount.value)
  if (!Number.isFinite(cents) || cents <= 0) {
    ElMessage.warning('请输入正确的金额')
    return
  }
  if (categoryId.value === null) {
    ElMessage.warning('请选择分类')
    return
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date.value)) {
    ElMessage.warning('请选择日期')
    return
  }

  saving.value = true
  try {
    await unwrap(
      window.api.records.create({
        amountCents: cents,
        type: type.value,
        categoryId: categoryId.value,
        date: date.value,
        note: note.value.trim() || undefined
      })
    )
    ElMessage.success('保存成功 🐾')
    // 保存后清空金额和备注，停在当前页方便连续记账
    amount.value = ''
    note.value = ''
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="view">
    <h1 class="view-title">✏️ 记一笔</h1>
    <p class="view-desc">今天又花了什么？记下来吧 🐾</p>

    <div v-if="!store.loaded" class="form-card">
      <p class="view-desc">正在加载分类…</p>
    </div>

    <div v-else class="form-card">
      <TypeToggle v-model="type" />

      <AmountInput v-model="amount" @enter="save" />

      <div class="form-label">分类</div>
      <CategoryPicker v-model="categoryId" :type="type" />

      <div class="form-row">
        <div class="form-field">
          <div class="form-label">日期</div>
          <el-date-picker
            v-model="date"
            type="date"
            value-format="YYYY-MM-DD"
            format="YYYY年MM月DD日"
            placeholder="选择日期"
            :clearable="false"
            style="width: 100%"
          />
        </div>
        <div class="form-field">
          <div class="form-label">备注（可选）</div>
          <input
            v-model="note"
            class="note-input"
            type="text"
            placeholder="比如：给多宝买狗粮"
            maxlength="50"
          />
        </div>
      </div>

      <button class="pika-btn pika-btn-lg save-btn" :disabled="saving" @click="save">
        {{ saving ? '保存中…' : '保存这笔账 🐕' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.form-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 18px;
  padding: 26px 28px;
  background: var(--pika-card);
  border: 1px solid var(--pika-hairline);
  border-radius: var(--pika-radius);
  box-shadow: var(--pika-shadow);
}

.form-label {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--pika-muted);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.note-input {
  width: 100%;
  box-sizing: border-box;
  padding: 9px 14px;
  font-size: 14px;
  color: var(--pika-ink);
  background: var(--pika-cream);
  border: 1px solid var(--pika-hairline);
  border-radius: 12px;
  outline: none;
  transition: border-color 0.15s ease;
}

.note-input:focus {
  border-color: var(--pika-yellow);
}

.save-btn {
  align-self: center;
  margin-top: 4px;
}
</style>
