import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
} from "@mui/material";
import {
  MAX_WORD_LENGTH,
  MAX_TRANSLATION_LENGTH,
  clampAndStripControlChars,
} from "@/lib/sanitize";
import type { LibraryEditingItem } from "../LibraryPage.models";

export type EditWordDialogProps = {
  open: boolean;
  editingItem: LibraryEditingItem | null;
  onClose: () => void;
  onWordChange: (word: string) => void;
  onTranslationChange: (translation: string) => void;
  onSave: () => void;
  isPending: boolean;
};

export function EditWordDialog({
  open,
  editingItem,
  onClose,
  onWordChange,
  onTranslationChange,
  onSave,
  isPending,
}: EditWordDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit word</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            pt: 1,
            minWidth: 320,
          }}
        >
          <TextField
            autoFocus
            label="Word"
            value={editingItem?.word ?? ""}
            onChange={(e) =>
              onWordChange(
                clampAndStripControlChars(e.target.value, MAX_WORD_LENGTH),
              )
            }
          />
          <TextField
            label="Translation"
            value={editingItem?.translation ?? ""}
            onChange={(e) =>
              onTranslationChange(
                clampAndStripControlChars(
                  e.target.value,
                  MAX_TRANSLATION_LENGTH,
                ),
              )
            }
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={
            !editingItem?.word.trim() ||
            !editingItem?.translation.trim() ||
            isPending
          }
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
