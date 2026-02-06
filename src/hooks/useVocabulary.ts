import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listVocabulary,
  createVocabulary,
  updateVocabulary,
  deleteVocabulary,
  listUserVocabulary,
  addToUserLibrary,
  updateUserVocabulary,
  removeFromUserLibrary,
} from '@/api/vocabulary'
import type {
  VocabularyInsert,
  VocabularyUpdate,
  UserVocabularyInsert,
  UserVocabularyUpdate,
} from '@/types/database'

// ---------- Vocabulary (app + user words) ----------

export function vocabularyListQueryKey(
  languageFrom: string,
  languageTo: string,
  includeUser?: boolean,
  userId?: string
) {
  return ['vocabulary', languageFrom, languageTo, includeUser ?? false, userId ?? null] as const
}

export function useVocabularyList(params: {
  languageFrom: string
  languageTo: string
  includeUserCreated?: boolean
  userId?: string
}) {
  return useQuery({
    queryKey: vocabularyListQueryKey(
      params.languageFrom,
      params.languageTo,
      params.includeUserCreated,
      params.userId
    ),
    queryFn: async () => {
      const { data, error } = await listVocabulary({
        languageFrom: params.languageFrom,
        languageTo: params.languageTo,
        includeUserCreated: params.includeUserCreated,
        userId: params.userId,
      })
      if (error) throw error
      return data
    },
    enabled: !!params.languageFrom && !!params.languageTo,
  })
}

export function useCreateVocabulary(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: VocabularyInsert) => createVocabulary(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] })
      queryClient.invalidateQueries({ queryKey: ['user-vocabulary', userId] })
    },
  })
}

export function useUpdateVocabulary(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: VocabularyUpdate }) =>
      updateVocabulary(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] })
      queryClient.invalidateQueries({ queryKey: ['user-vocabulary', userId] })
    },
  })
}

export function useDeleteVocabulary(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteVocabulary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] })
      queryClient.invalidateQueries({ queryKey: ['user-vocabulary', userId] })
    },
  })
}

// ---------- User library (user_vocabulary) ----------

export function userVocabularyListQueryKey(userId: string) {
  return ['user-vocabulary', userId] as const
}

export function useUserVocabularyList(userId: string | undefined) {
  return useQuery({
    queryKey: userVocabularyListQueryKey(userId ?? ''),
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await listUserVocabulary(userId)
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}

export function useAddToUserLibrary(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UserVocabularyInsert) => addToUserLibrary(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-vocabulary', userId] })
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] })
    },
  })
}

export function useUpdateUserVocabulary(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UserVocabularyUpdate }) =>
      updateUserVocabulary(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-vocabulary', userId] })
    },
  })
}

export function useRemoveFromUserLibrary(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => removeFromUserLibrary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-vocabulary', userId] })
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] })
    },
  })
}
