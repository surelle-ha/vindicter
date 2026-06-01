import { defineStore } from 'pinia'

export type FeedCategory = 'scan_complete' | 'scan_error' | 'rss_article' | 'finding_new' | 'finding_stale' | 'info'

export interface FeedItem {
  id: string
  category: FeedCategory
  title: string
  body: string
  read: boolean
  createdAt: number
  link?: string
  meta?: Record<string, string>
}

const STORAGE_KEY = 'vindicta:notif-feed:v1'
const MAX_ITEMS = 100

export const useNotificationFeedStore = defineStore('notificationFeed', {
  state: () => ({
    items: [] as FeedItem[],
    drawerOpen: false,
  }),

  getters: {
    unreadCount: state => state.items.filter(i => !i.read).length,
    recent: state => state.items.slice(0, 20),
  },

  actions: {
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) this.items = JSON.parse(raw) as FeedItem[]
      }
      catch { /* ignore */ }
    },

    _persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items.slice(0, MAX_ITEMS)))
      }
      catch { /* ignore */ }
    },

    push(item: Omit<FeedItem, 'id' | 'read' | 'createdAt'>) {
      const id = `feed_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      this.items.unshift({ ...item, id, read: false, createdAt: Date.now() })
      if (this.items.length > MAX_ITEMS) this.items = this.items.slice(0, MAX_ITEMS)
      this._persist()
    },

    markRead(id: string) {
      const item = this.items.find(i => i.id === id)
      if (item) item.read = true
      this._persist()
    },

    markAllRead() {
      this.items.forEach(i => { i.read = true })
      this._persist()
    },

    dismiss(id: string) {
      this.items = this.items.filter(i => i.id !== id)
      this._persist()
    },

    clearAll() {
      this.items = []
      this._persist()
    },

    openDrawer() { this.drawerOpen = true },
    closeDrawer() { this.drawerOpen = false },
  },
})
