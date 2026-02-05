import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export function useAuth() {
  const { user, session, loading, setAuth, setLoading, signOut: clearStore } = useAuthStore()
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    // Only set loading true on initial load (no session yet). Otherwise another
    // useAuth consumer (e.g. Navbar) would set it true again and we'd get stuck.
    if (!useAuthStore.getState().session) {
      setLoading(true)
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (mounted.current) {
          setAuth(session?.user ?? null, session ?? null)
        }
      })
      .catch(() => {
        if (mounted.current) {
          setAuth(null, null)
        }
      })

    supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted.current) {
        setAuth(session?.user ?? null, session ?? null)
      }
    })

    return () => {
      mounted.current = false
      // Intentionally not unsubscribing: unsubscribe() can trigger an unhandled
      // "operation was aborted" in Supabase under React Strict Mode. Callback no-ops when unmounted.
    }
  }, [setAuth, setLoading])

  const signOut = async () => {
    await supabase.auth.signOut()
    clearStore()
  }

  return {
    user,
    session,
    loading,
    isAuthenticated: !!session,
    signOut,
  }
}
