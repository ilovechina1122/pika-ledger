<script setup lang="ts">
defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string]; enter: [] }>()

// 只允许数字 + 一个小数点 + 最多两位小数
function sanitize(raw: string): string {
  let v = raw.replace(/[^\d.]/g, '')
  const firstDot = v.indexOf('.')
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '')
  }
  const [int, dec] = v.split('.')
  if (dec !== undefined && dec.length > 2) v = `${int}.${dec.slice(0, 2)}`
  return v
}

function onInput(e: Event): void {
  emit('update:modelValue', sanitize((e.target as HTMLInputElement).value))
}
</script>

<template>
  <div class="amount-wrap">
    <span class="amount-currency">¥</span>
    <input
      class="amount-input"
      :value="modelValue"
      type="text"
      inputmode="decimal"
      placeholder="0.00"
      autofocus
      @input="onInput"
      @keydown.enter="emit('enter')"
    />
  </div>
</template>

<style scoped>
.amount-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 22px;
  background: var(--pika-cream);
  border: 2px solid var(--pika-hairline);
  border-radius: 18px;
  transition: border-color 0.15s ease;
}

.amount-wrap:focus-within {
  border-color: var(--pika-yellow);
}

.amount-currency {
  font-size: 30px;
  font-weight: 700;
  color: var(--pika-muted);
}

.amount-input {
  flex: 1;
  min-width: 0;
  font-size: 44px;
  font-weight: 700;
  color: var(--pika-ink);
  background: transparent;
  border: none;
  outline: none;
}

.amount-input::placeholder {
  color: var(--pika-hairline);
}
</style>
