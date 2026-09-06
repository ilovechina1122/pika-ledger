<script setup lang="ts">
const navItems = [
  { path: '/add', emoji: '✏️', label: '记一笔' },
  { path: '/records', emoji: '📒', label: '账单' },
  { path: '/stats', emoji: '📊', label: '统计' },
  { path: '/categories', emoji: '🗂️', label: '分类管理' }
]
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-badge">🐕</div>
        <div class="logo-text">
          <div class="logo-name">多宝记账</div>
          <div class="logo-sub">每一笔，都算数</div>
        </div>
      </div>

      <nav class="nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          active-class="nav-item-active"
        >
          <span class="nav-emoji">{{ item.emoji }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">🐾 和多宝一起记账</div>
    </aside>

    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  height: 100vh;
  background: var(--pika-cream);
}

.sidebar {
  display: flex;
  flex-direction: column;
  width: 200px;
  flex-shrink: 0;
  padding: 24px 16px;
  background: var(--pika-card);
  border-right: 1px solid var(--pika-hairline);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px 20px;
}

.logo-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  font-size: 24px;
  background: var(--pika-yellow);
  border-radius: 14px;
}

.logo-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--pika-ink);
}

.logo-sub {
  margin-top: 2px;
  font-size: 11px;
  color: var(--pika-muted);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  font-size: 14px;
  color: var(--pika-ink);
  text-decoration: none;
  border-radius: 14px;
  transition: background 0.15s ease;
}

.nav-item:hover {
  background: var(--pika-cream);
}

.nav-item-active {
  background: var(--pika-yellow);
  font-weight: 600;
}

.nav-emoji {
  font-size: 17px;
}

.sidebar-footer {
  margin-top: auto;
  padding: 0 8px;
  font-size: 11px;
  color: var(--pika-muted);
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px;
}

/* 窄窗口时收起侧边栏文字，只留图标 */
@media (max-width: 940px) {
  .sidebar {
    width: 72px;
    padding: 24px 10px;
  }

  .logo-text,
  .nav-label,
  .sidebar-footer {
    display: none;
  }

  .logo {
    justify-content: center;
    padding-left: 0;
    padding-right: 0;
  }

  .nav-item {
    justify-content: center;
    padding: 12px 0;
  }
}
</style>
