import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { DictionaryEntry } from "@/lib/dictionary";
import type { ResultItem } from "../DictionaryPage.models";

export type DictionaryResultsListProps = {
  results: ResultItem[];
  isOffline: boolean;
  hasStoreResults: boolean;
  apiLoading: boolean;
  apiError: string | null;
  searchTrimmed: boolean;
  apiSupported: boolean;
  isItemInLibrary: (item: ResultItem) => boolean;
  onAddFromStore: (vocabularyId: string) => void;
  onAddFromApi: (entry: DictionaryEntry) => void;
  onDismissError: () => void;
  addToLibraryPending: boolean;
  addWordPending: boolean;
  userId: string;
};

export function DictionaryResultsList({
  results,
  isOffline,
  hasStoreResults,
  apiLoading,
  apiError,
  searchTrimmed,
  apiSupported,
  isItemInLibrary,
  onAddFromStore,
  onAddFromApi,
  onDismissError,
  addToLibraryPending,
  addWordPending,
  userId,
}: DictionaryResultsListProps) {
  const showEmpty =
    !apiLoading &&
    searchTrimmed &&
    results.length === 0 &&
    !hasStoreResults &&
    (isOffline || !apiSupported);
  const showEmptyNoApi =
    !apiLoading &&
    searchTrimmed &&
    results.length === 0 &&
    !hasStoreResults &&
    apiSupported &&
    !isOffline &&
    !apiError;

  return (
    <>
      {isOffline && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {hasStoreResults
            ? "You're offline. Showing words from your library and the app dictionary."
            : "You're offline. Connect to the internet to search for more words."}
        </Alert>
      )}

      {apiError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={onDismissError}
          data-testid="dictionary-error"
        >
          {apiError}
        </Alert>
      )}

      {apiLoading && !hasStoreResults && (
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
          data-testid="dictionary-loading"
        >
          <CircularProgress size={24} />
          <Typography variant="body2">Searching…</Typography>
        </Box>
      )}

      {showEmpty && (
        <Typography
          color="text.secondary"
          variant="body2"
          sx={{ mb: 2 }}
          data-testid="dictionary-empty"
        >
          {isOffline
            ? "Connect to the internet to look up this word."
            : "No results found. Try another word or direction."}
        </Typography>
      )}

      {showEmptyNoApi && (
        <Typography
          color="text.secondary"
          variant="body2"
          sx={{ mb: 2 }}
          data-testid="dictionary-empty"
        >
          No translation found. Try another word.
        </Typography>
      )}

      {results.length > 0 && (
        <List dense sx={{ bgcolor: "action.hover", borderRadius: 1 }}>
          {results.map((item, index) => {
            if (item.source === "store") {
              const inLibrary = isItemInLibrary(item);
              return (
                <ListItem key={`store-${item.vocabularyId}`} divider>
                  <ListItemText
                    primary={`${item.word} — ${item.translation}`}
                    secondary={`${item.from} → ${item.to}`}
                  />
                  <ListItemSecondaryAction>
                    {inLibrary ? (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <CheckCircleIcon color="success" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          In library
                        </Typography>
                      </Box>
                    ) : (
                      <IconButton
                        aria-label="Add to library"
                        onClick={() => onAddFromStore(item.vocabularyId)}
                        disabled={addToLibraryPending}
                        color="primary"
                      >
                        <AddCircleOutlineIcon />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              );
            }
            const { entry } = item;
            const inLibrary = isItemInLibrary(item);
            return (
              <ListItem
                key={`api-${entry.word}-${entry.translation}-${index}`}
                divider
              >
                <ListItemText
                  primary={`${entry.word} — ${entry.translation}`}
                  secondary={`${entry.language_from} → ${entry.language_to}`}
                />
                <ListItemSecondaryAction>
                  {inLibrary ? (
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <CheckCircleIcon color="success" fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        In library
                      </Typography>
                    </Box>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => onAddFromApi(entry)}
                      disabled={!userId || addWordPending}
                    >
                      {addWordPending ? "Adding…" : "Add to library"}
                    </Button>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>
      )}

      {!searchTrimmed && !apiLoading && (
        <Typography color="text.secondary" variant="body2">
          Enter a word and choose a direction. Results from your saved words
          appear first; when you're online, we'll also search for more.
        </Typography>
      )}
    </>
  );
}
