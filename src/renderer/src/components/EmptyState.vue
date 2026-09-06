<script setup lang="ts">
defineProps<{ text?: string }>()
</script>

<template>
  <div class="empty-state">
    <div class="empty-dog">🐕</div>
    <div class="empty-text">{{ text ?? '还没有数据哦，去记一笔吧～' }}</div>
    <router-link v-if="!text" to="/add" class="pika-btn empty-btn">去记一笔</router-link>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 60px;
}

.empty-dog {
  font-size: 64px;
}

.empty-text {
  font-size: 14px;
  color: var(--pika-muted);
}

.empty-btn {
  display: inline-block;
  text-decoration: none;
}
</style>
