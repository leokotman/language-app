import { Box, Button, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";

export type ImportExportBarProps = {
  exportRowCount: number;
  onExportCsv: () => void;
  onExportJson: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImportClick: () => void;
  onImportFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isImporting: boolean;
  importMessage: string | null;
};

export function ImportExportBar({
  exportRowCount,
  onExportCsv,
  onExportJson,
  fileInputRef,
  onImportClick,
  onImportFileChange,
  isImporting,
  importMessage,
}: ImportExportBarProps) {
  return (
    <Box
      sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}
    >
      <Button
        size="small"
        startIcon={<DownloadIcon />}
        onClick={onExportCsv}
        disabled={exportRowCount === 0}
      >
        Export CSV
      </Button>
      <Button
        size="small"
        startIcon={<DownloadIcon />}
        onClick={onExportJson}
        disabled={exportRowCount === 0}
      >
        Export JSON
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json"
        style={{ display: "none" }}
        onChange={onImportFileChange}
      />
      <Button
        size="small"
        startIcon={<UploadIcon />}
        onClick={onImportClick}
        disabled={isImporting}
      >
        {isImporting ? "Importing…" : "Import"}
      </Button>
      {importMessage && (
        <Typography variant="body2" color="text.secondary">
          {importMessage}
        </Typography>
      )}
    </Box>
  );
}
