import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from 'firebase/auth'

interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: 'ledger-auth',
      partialize: (state) => ({ 
          // Only persist necessary user info to avoid serializing complex Firebase User object issues if any
          // Actually, Firebase User object is not properly serializable by default in some cases due to internal methods.
          // Better to store a simplified object or rely on Firebase's own persistence (onAuthStateChanged).
          // However, for Zustand simplicity let's just use onAuthStateChanged in App.tsx to sync.
          // We can skip persistence here and rely on Firebase SDK or just persist basic info.
          // Let's persist basic info for immediate UI rendering before Firebase SDK loads.
          user: state.user 
      }), 
    }
  )
)
