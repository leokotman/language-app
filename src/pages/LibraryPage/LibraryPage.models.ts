export type LibraryItem = {
  id: string;
  vocabulary_id: string;
  vocabulary: {
    word: string;
    translation: string;
    language_from: string;
    language_to: string;
  } | null;
};

export type LibraryEditingItem = {
  vocabulary_id: string;
  word: string;
  translation: string;
};
