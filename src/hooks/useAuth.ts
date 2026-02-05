import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export function useAuth() {
  const { user, session, loading, setAuth, setLoading, signOut: clearStore } = useAuthStore()

  useEffect(() => {
    setLoading(true)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuth(session?.user ?? null, session ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(session?.user ?? null, session ?? null)
    })

    return () => subscription.unsubscribe()
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
