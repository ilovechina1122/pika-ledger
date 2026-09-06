<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { ElDialog, ElDatePicker, ElMessage } from 'element-plus'
import type { TransactionRecord, TxType } from '@shared/types'
import { unwrap } from '../api'
import TypeToggle from './TypeToggle.vue'
import AmountInput from './AmountInput.vue'
import CategoryPicker from './CategoryPicker.vue'

const props = defineProps<{ visible: boolean; record: TransactionRecord | null }>()
const emit = defineEmits<{ 'update:visible': [value: boolean]; saved: [] }>()

const form = reactive({
  amount: '',
  type: 'expense' as TxType,
  categoryId: null as number | null,
  date: dayjs().format('YYYY-MM-DD'),
  note: ''
})
const saving = ref(false)

// 打开弹窗时用记录填充表单
watch(
  () => props.visible,
  (v) => {
    if (v && props.record) {
      form.amount = (props.record.amountCents / 100).toFixed(2)
      form.type = props.record.type
      form.categoryId = props.record.categoryId
      form.date = props.record.date
      form.note = props.record.note
    }
  }
)

async function save(): Promise<void> {
  if (!props.record) return
  const cents = Math.round(parseFloat(form.amount) * 100)
  if (!Number.isFinite(cents) || cents <= 0) {
    ElMessage.warning('请输入正确的金额')
    return
  }
  if (form.categoryId === null) {
    ElMessage.warning('请选择分类')
    return
  }

  saving.value = true
  try {
    await unwrap(
      window.api.records.update({
        id: props.record.id,
        amountCents: cents,
        type: form.type,
        categoryId: form.categoryId,
        date: form.date,
        note: form.note.trim()
      })
    )
    ElMessage.success('已保存 🐾')
    emit('update:visible', false)
    emit('saved')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="✏️ 编辑这笔账"
    width="480px"
    align-center
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="dialog-form">
      <TypeToggle v-model="form.type" />
      <AmountInput v-model="form.amount" @enter="save" />
      <div class="form-label">分类</div>
      <CategoryPicker v-model="form.categoryId" :type="form.type" />
      <div class="form-row">
        <div>
          <div class="form-label">日期</div>
          <el-date-picker
            v-model="form.date"
            type="date"
            value-format="YYYY-MM-DD"
            format="YYYY年MM月DD日"
            :clearable="false"
            style="width: 100%"
          />
        </div>
        <div>
          <div class="form-label">备注</div>
          <input v-model="form.note" class="note-input" type="text" maxlength="50" />
        </div>
      </div>
    </div>

    <template #footer>
      <button class="pika-btn" :disabled="saving" @click="save">
        {{ saving ? '保存中…' : '保存' }}
      </button>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-label {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--pika-muted);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.note-input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  font-size: 14px;
  color: var(--pika-ink);
  background: var(--pika-cream);
  border: 1px solid var(--pika-hairline);
  border-radius: 12px;
  outline: none;
}

.note-input:focus {
  border-color: var(--pika-yellow);
}
</style>
