import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getUserLanguages,
  addUserLanguage,
  removeUserLanguage,
  removeUserLanguagesByIds,
  addBidirectionalPair,
  updateUserLanguage,
} from '@/api/userLanguages'
import type { UserLanguageInsert, UserLanguageRowUpdate } from '@/types/database'

export const USER_LANGUAGES_QUERY_KEY = ['user-languages']

export function useUserLanguages(userId: string | undefined) {
  return useQuery({
    queryKey: [...USER_LANGUAGES_QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await getUserLanguages(userId)
      if (error) throw error
      return data
    },
    enabled: !!userId,
    networkMode: 'always', // run when offline so getUserLanguages can return from IndexedDB cache
  })
}

export function useAddUserLanguage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UserLanguageInsert) => addUserLanguage(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...USER_LANGUAGES_QUERY_KEY, variables.user_id] })
    },
  })
}

export function useRemoveUserLanguage(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => removeUserLanguage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...USER_LANGUAGES_QUERY_KEY, userId] })
    },
  })
}

export function useRemoveUserLanguagesByIds(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => removeUserLanguagesByIds(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...USER_LANGUAGES_QUERY_KEY, userId] })
    },
  })
}

export function useAddBidirectionalPair() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, key }: { userId: string; key: string }) =>
      addBidirectionalPair(userId, key),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...USER_LANGUAGES_QUERY_KEY, variables.userId],
      })
    },
  })
}

export function useUpdateUserLanguage(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UserLanguageRowUpdate }) =>
      updateUserLanguage(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...USER_LANGUAGES_QUERY_KEY, userId] })
    },
  })
}
