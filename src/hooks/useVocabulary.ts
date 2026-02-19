import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listVocabulary,
  createVocabulary,
  updateVocabulary,
  deleteVocabulary,
  listUserVocabulary,
  listDueToday,
  addToUserLibrary,
  updateUserVocabulary,
  removeFromUserLibrary,
  addWordToLibrary,
} from "@/api/vocabulary";
import type { DueTodayFilters } from "@/api/vocabulary";
import type {
  VocabularyInsert,
  VocabularyUpdate,
  UserVocabularyInsert,
  UserVocabularyUpdate,
} from "@/types/database";

// ---------- Vocabulary (app + user words) ----------

export function vocabularyListQueryKey(
  languageFrom: string,
  languageTo: string,
  includeUser?: boolean,
  userId?: string,
) {
  return [
    "vocabulary",
    languageFrom,
    languageTo,
    includeUser ?? false,
    userId ?? null,
  ] as const;
}

export function useVocabularyList(params: {
  languageFrom: string;
  languageTo: string;
  includeUserCreated?: boolean;
  userId?: string;
}) {
  return useQuery({
    queryKey: vocabularyListQueryKey(
      params.languageFrom,
      params.languageTo,
      params.includeUserCreated,
      params.userId,
    ),
    queryFn: async () => {
      const { data, error } = await listVocabulary({
        languageFrom: params.languageFrom,
        languageTo: params.languageTo,
        includeUserCreated: params.includeUserCreated,
        userId: params.userId,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!params.languageFrom && !!params.languageTo,
    networkMode: "always", // run when offline so listVocabulary can return from IndexedDB cache
  });
}

export function useCreateVocabulary(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VocabularyInsert) => createVocabulary(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
      queryClient.invalidateQueries({ queryKey: ["user-vocabulary", userId] });
    },
  });
}

export function useUpdateVocabulary(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: VocabularyUpdate }) =>
      updateVocabulary(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
      queryClient.invalidateQueries({ queryKey: ["user-vocabulary", userId] });
    },
  });
}

export function useDeleteVocabulary(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVocabulary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
      queryClient.invalidateQueries({ queryKey: ["user-vocabulary", userId] });
    },
  });
}

// ---------- User library (user_vocabulary) ----------

export function userVocabularyListQueryKey(userId: string) {
  return ["user-vocabulary", userId] as const;
}

export function dueTodayQueryKey(userId: string, filters?: DueTodayFilters) {
  return [
    "due-today",
    userId,
    filters?.languageFrom ?? null,
    filters?.languageTo ?? null,
    filters?.pairKey ?? null,
  ] as const;
}

export function useDueToday(
  userId: string | undefined,
  filters?: DueTodayFilters,
) {
  return useQuery({
    queryKey: dueTodayQueryKey(userId ?? "", filters),
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await listDueToday(userId, filters);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useUserVocabularyList(userId: string | undefined) {
  return useQuery({
    queryKey: userVocabularyListQueryKey(userId ?? ""),
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await listUserVocabulary(userId);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    networkMode: "always", // run when offline so listUserVocabulary can return from IndexedDB cache
  });
}

export function useAddToUserLibrary(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserVocabularyInsert) => addToUserLibrary(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-vocabulary", userId] });
      queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
    },
  });
}

export function useUpdateUserVocabulary(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: UserVocabularyUpdate;
    }) => updateUserVocabulary(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-vocabulary", userId] });
      queryClient.invalidateQueries({ queryKey: ["due-today", userId] });
    },
  });
}

export function useRemoveFromUserLibrary(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeFromUserLibrary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-vocabulary", userId] });
      queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
    },
  });
}

/** Add a new word (create vocabulary + add to user library) in one step. */
export function useAddWordToLibrary(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      word: string;
      translation: string;
      language_from: string;
      language_to: string;
    }) => addWordToLibrary(userId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-vocabulary", userId] });
      queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
    },
  });
}
