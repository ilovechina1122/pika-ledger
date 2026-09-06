import { defineStore } from 'pinia'
import type { Category } from '@shared/types'
import { unwrap } from '../api'

// 分类数据是「记一笔 / 账单 / 统计 / 分类管理」四页共用，放全局 store 统一管理
export const useCategoriesStore = defineStore('categories', {
  state: () => ({
    list: [] as Category[],
    loaded: false
  }),
  getters: {
    // 可见的一级大类
    topLevel: (state) => state.list.filter((c) => c.parentId === null && !c.isHidden),
    // 一级大类 id -> 可见二级小类数组（顺序即展示顺序）
    childrenOf(state): Map<number, Category[]> {
      const map = new Map<number, Category[]>()
      for (const c of state.list) {
        if (c.parentId !== null && !c.isHidden) {
          const arr = map.get(c.parentId) ?? []
          arr.push(c)
          map.set(c.parentId, arr)
        }
      }
      return map
    }
  },
  actions: {
    async refresh(): Promise<void> {
      this.list = await unwrap(window.api.categories.list())
      this.loaded = true
    }
  }
})
