import { describe, it, expect } from "vitest";
import {
  exportToCsv,
  exportToJson,
  parseLibraryFile,
  type LibraryExportRow,
} from "@/lib/importExport";

/** Create a file-like object for tests (jsdom may not provide File#text()). */
function createFile(content: string, name: string, type: string): File {
  return {
    name,
    type,
    text: () => Promise.resolve(content),
  } as unknown as File;
}

describe("importExport", () => {
  describe("exportToCsv", () => {
    it("exports empty array as header only", () => {
      expect(exportToCsv([])).toBe(
        "word,translation,language_from,language_to",
      );
    });
    it("exports rows with escaped fields", () => {
      const rows: LibraryExportRow[] = [
        {
          word: "hello",
          translation: "привет",
          language_from: "en",
          language_to: "ru",
        },
      ];
      expect(exportToCsv(rows)).toBe(
        "word,translation,language_from,language_to\nhello,привет,en,ru",
      );
    });
    it("escapes double quotes and commas in fields", () => {
      const rows: LibraryExportRow[] = [
        {
          word: 'say "hi"',
          translation: "a,b",
          language_from: "en",
          language_to: "ru",
        },
      ];
      expect(exportToCsv(rows)).toContain('"say ""hi"""');
      expect(exportToCsv(rows)).toContain('"a,b"');
    });
  });

  describe("exportToJson", () => {
    it("exports empty array as formatted JSON", () => {
      expect(exportToJson([])).toBe("[]");
    });
    it("exports rows as formatted JSON", () => {
      const rows: LibraryExportRow[] = [
        {
          word: "hello",
          translation: "привет",
          language_from: "en",
          language_to: "ru",
        },
      ];
      const out = exportToJson(rows);
      expect(JSON.parse(out)).toEqual(rows);
    });
  });

  describe("parseLibraryFile", () => {
    it("parses JSON file and returns rows", async () => {
      const json = JSON.stringify([
        {
          word: "hello",
          translation: "hi",
          language_from: "en",
          language_to: "ru",
        },
      ]);
      const file = createFile(json, "lib.json", "application/json");
      const result = await parseLibraryFile(file);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({
        word: "hello",
        translation: "hi",
        language_from: "en",
        language_to: "ru",
      });
      expect(result.errors).toHaveLength(0);
    });
    it("parses CSV file with header", async () => {
      const csv =
        "word,translation,language_from,language_to\nhello,привет,en,ru";
      const file = createFile(csv, "lib.csv", "text/csv");
      const result = await parseLibraryFile(file);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].word).toBe("hello");
      expect(result.rows[0].translation).toBe("привет");
      expect(result.errors).toHaveLength(0);
    });
    it("returns errors for invalid JSON", async () => {
      const file = createFile("not json", "x.json", "application/json");
      const result = await parseLibraryFile(file);
      expect(result.rows).toHaveLength(0);
      expect(result.errors).toContain("Invalid JSON");
    });
    it("returns errors for non-array JSON", async () => {
      const file = createFile("{}", "x.json", "application/json");
      const result = await parseLibraryFile(file);
      expect(result.rows).toHaveLength(0);
      expect(result.errors).toContain("JSON must be an array of objects");
    });
    it("validates row fields and returns errors for invalid rows", async () => {
      const json = JSON.stringify([
        {
          word: "ok",
          translation: "ok",
          language_from: "en",
          language_to: "ru",
        },
        { word: "", translation: "x", language_from: "en", language_to: "ru" },
      ]);
      const file = createFile(json, "x.json", "application/json");
      const result = await parseLibraryFile(file);
      expect(result.rows).toHaveLength(1);
      expect(
        result.errors.some((e) => e.includes("missing or empty word")),
      ).toBe(true);
    });
    it("rejects unsupported language codes", async () => {
      const json = JSON.stringify([
        { word: "x", translation: "y", language_from: "xx", language_to: "ru" },
      ]);
      const file = createFile(json, "x.json", "application/json");
      const result = await parseLibraryFile(file);
      expect(result.rows).toHaveLength(0);
      expect(
        result.errors.some((e) => e.includes("language_from must be")),
      ).toBe(true);
    });
    it("rejects same language_from and language_to", async () => {
      const json = JSON.stringify([
        { word: "x", translation: "y", language_from: "en", language_to: "en" },
      ]);
      const file = createFile(json, "x.json", "application/json");
      const result = await parseLibraryFile(file);
      expect(result.rows).toHaveLength(0);
      expect(result.errors.some((e) => e.includes("must differ"))).toBe(true);
    });
    it("treats content starting with [ as JSON", async () => {
      const file = createFile(
        '[{"word":"a","translation":"b","language_from":"en","language_to":"ru"}]',
        "data.txt",
        "text/plain",
      );
      const result = await parseLibraryFile(file);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].word).toBe("a");
    });
  });
});
