import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddWordForm } from "@/pages/LibraryPage/components/AddWordForm";
import { EditWordDialog } from "@/pages/LibraryPage/components/EditWordDialog";
import { ImportExportBar } from "@/pages/LibraryPage/components/ImportExportBar";
import { LibraryFilterBar } from "@/pages/LibraryPage/components/LibraryFilterBar";
import { LibraryList } from "@/pages/LibraryPage/components/LibraryList";
import type { LibraryItem } from "@/pages/LibraryPage/LibraryPage.models";

vi.mock("@/lib/sanitize", () => ({
  clampAndStripControlChars: (s: string) => s,
  MAX_WORD_LENGTH: 100,
  MAX_TRANSLATION_LENGTH: 200,
  MAX_SEARCH_LENGTH: 100,
}));

const pairOptions = [{ value: "en-ru", label: "English ↔ Russian" }];
const directionOptions = [
  { value: "en-ru", label: "English → Russian" },
  { value: "ru-en", label: "Russian → English" },
];

describe("AddWordForm", () => {
  it("renders word and translation fields and add button", () => {
    const onAdd = vi.fn();
    render(
      <AddWordForm
        word="hello"
        translation="привет"
        pairKey="en-ru"
        direction="en-ru"
        pairOptions={pairOptions}
        directionOptions={directionOptions}
        placeholders={{ word: "e.g. hello", translation: "e.g. привет" }}
        onWordChange={() => {}}
        onTranslationChange={() => {}}
        onPairKeyChange={() => {}}
        onDirectionChange={() => {}}
        onAdd={onAdd}
        isPending={false}
        hasError={false}
      />,
    );
    expect(screen.getByRole("textbox", { name: /word/i })).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /translation/i }),
    ).toBeInTheDocument();
    const addBtn = screen.getByRole("button", { name: /^add$/i });
    expect(addBtn).toBeInTheDocument();
    fireEvent.click(addBtn);
    expect(onAdd).toHaveBeenCalled();
  });

  it("shows error message when hasError is true", () => {
    render(
      <AddWordForm
        word=""
        translation=""
        pairKey="en-ru"
        direction="en-ru"
        pairOptions={pairOptions}
        directionOptions={directionOptions}
        placeholders={{ word: "", translation: "" }}
        onWordChange={() => {}}
        onTranslationChange={() => {}}
        onPairKeyChange={() => {}}
        onDirectionChange={() => {}}
        onAdd={() => {}}
        isPending={false}
        hasError
      />,
    );
    expect(
      screen.getByText(/could not add word. try again./i),
    ).toBeInTheDocument();
  });
});

describe("EditWordDialog", () => {
  it("renders closed when open is false", () => {
    render(
      <EditWordDialog
        open={false}
        editingItem={null}
        onClose={() => {}}
        onWordChange={() => {}}
        onTranslationChange={() => {}}
        onSave={() => {}}
        isPending={false}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog with word and translation when open", () => {
    const onSave = vi.fn();
    render(
      <EditWordDialog
        open
        editingItem={{
          vocabulary_id: "v1",
          word: "hello",
          translation: "привет",
        }}
        onClose={() => {}}
        onWordChange={() => {}}
        onTranslationChange={() => {}}
        onSave={onSave}
        isPending={false}
      />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Edit word" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("hello")).toBeInTheDocument();
    expect(screen.getByDisplayValue("привет")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalled();
  });
});

describe("ImportExportBar", () => {
  it("renders export and import buttons and shows import message when set", () => {
    const fileInputRef = { current: null as HTMLInputElement | null };
    render(
      <ImportExportBar
        exportRowCount={0}
        onExportCsv={() => {}}
        onExportJson={() => {}}
        fileInputRef={fileInputRef}
        onImportClick={() => {}}
        onImportFileChange={() => {}}
        isImporting={false}
        importMessage="3 rows imported."
      />,
    );
    expect(screen.getByRole("button", { name: "Export CSV" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Import" })).toBeInTheDocument();
    expect(screen.getByText("3 rows imported.")).toBeInTheDocument();
  });

  it("calls onExportCsv when Export CSV clicked and count > 0", () => {
    const onExportCsv = vi.fn();
    render(
      <ImportExportBar
        exportRowCount={5}
        onExportCsv={onExportCsv}
        onExportJson={() => {}}
        fileInputRef={{ current: null }}
        onImportClick={() => {}}
        onImportFileChange={() => {}}
        isImporting={false}
        importMessage={null}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    expect(onExportCsv).toHaveBeenCalled();
  });
});

describe("LibraryFilterBar", () => {
  it("renders search and language filter", () => {
    const onSearchChange = vi.fn();
    const onLanguageFilterChange = vi.fn();
    render(
      <LibraryFilterBar
        search=""
        languageFilter=""
        filterOptions={[{ value: "en-ru", label: "English ↔ Russian" }]}
        onSearchChange={onSearchChange}
        onLanguageFilterChange={onLanguageFilterChange}
      />,
    );
    const searchInput = screen.getByPlaceholderText(
      /search word or translation/i,
    );
    expect(searchInput).toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: "test" } });
    expect(onSearchChange).toHaveBeenCalledWith("test");
    expect(screen.getByLabelText("Language pair")).toBeInTheDocument();
  });
});

describe("LibraryList", () => {
  it("shows error alert when error is true", () => {
    render(
      <LibraryList
        items={[]}
        languageFilter=""
        onEdit={() => {}}
        onDelete={() => {}}
        isLoading={false}
        totalCount={0}
        error
      />,
    );
    expect(screen.getByTestId("library-error")).toBeInTheDocument();
    expect(
      screen.getByText(/failed to load your library/i),
    ).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(
      <LibraryList
        items={[]}
        languageFilter=""
        onEdit={() => {}}
        onDelete={() => {}}
        isLoading
        totalCount={0}
        error={false}
      />,
    );
    expect(screen.getByTestId("library-loading")).toBeInTheDocument();
  });

  it("shows empty message when no items and totalCount 0", () => {
    render(
      <LibraryList
        items={[]}
        languageFilter=""
        onEdit={() => {}}
        onDelete={() => {}}
        isLoading={false}
        totalCount={0}
        error={false}
      />,
    );
    expect(screen.getByTestId("library-empty")).toHaveTextContent(
      /no words yet/i,
    );
  });

  it("shows no match message when filtered empty", () => {
    render(
      <LibraryList
        items={[]}
        languageFilter="en-ru"
        onEdit={() => {}}
        onDelete={() => {}}
        isLoading={false}
        totalCount={3}
        error={false}
      />,
    );
    expect(screen.getByTestId("library-empty")).toHaveTextContent(
      /no words match/i,
    );
  });

  it("renders list of items with edit and delete buttons", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const items = [
      {
        id: "uv1",
        vocabulary_id: "v1",
        vocabulary: {
          word: "hello",
          translation: "привет",
          language_from: "en",
          language_to: "ru",
        },
      },
    ];
    const libraryItems: LibraryItem[] = items;
    render(
      <LibraryList
        items={libraryItems}
        languageFilter="en-ru"
        onEdit={onEdit}
        onDelete={onDelete}
        isLoading={false}
        totalCount={1}
        error={false}
      />,
    );
    expect(screen.getByTestId("library-list")).toBeInTheDocument();
    expect(screen.getByText("hello — привет")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Edit"));
    expect(onEdit).toHaveBeenCalledWith({
      vocabulary_id: "v1",
      word: "hello",
      translation: "привет",
    });
    fireEvent.click(screen.getByLabelText("Delete"));
    expect(onDelete).toHaveBeenCalledWith("v1");
  });
});
