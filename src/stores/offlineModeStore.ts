import { create } from 'zustand'
import { logError } from '@/lib/errors'

const STORAGE_KEY = 'language-app-offline-mode'

function getStored(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'true'
  } catch (err) {
    logError('offlineModeStore.getStored', err)
    return false
  }
}

interface OfflineModeState {
  offlineMode: boolean
  setOfflineMode: (value: boolean) => void
}

export const useOfflineModeStore = create<OfflineModeState>((set) => ({
  offlineMode: getStored(),
  setOfflineMode: (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(value))
    } catch (err) {
      logError('offlineModeStore.setOfflineMode', err)
      // Preference still applied in memory; only persistence failed (e.g. private mode quota)
    }
    set({ offlineMode: value })
  },
}))
