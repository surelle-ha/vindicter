let storeInstance: Awaited<ReturnType<typeof createStore>> | null = null

async function createStore() {
  const { Store } = await import('@tauri-apps/plugin-store')
  return await Store.load('vindicter-app.bin')
}

export function useTauriStore() {
  async function getStore() {
    if (!storeInstance) {
      storeInstance = await createStore()
    }
    return storeInstance
  }

  async function get<T>(key: string): Promise<T | null> {
    const store = await getStore()
    return (await store.get<T>(key)) ?? null
  }

  async function set(key: string, value: unknown): Promise<void> {
    const store = await getStore()
    await store.set(key, value)
  }

  async function del(key: string): Promise<void> {
    const store = await getStore()
    await store.delete(key)
  }

  async function save(): Promise<void> {
    const store = await getStore()
    await store.save()
  }

  return { get, set, delete: del, save }
}
