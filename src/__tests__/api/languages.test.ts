import { describe, it, expect, vi } from "vitest";
import { createSupabaseChain } from "../helpers/supabaseMock";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { getLanguages } from "@/api/languages";
import { supabase } from "@/lib/supabase";
import type { LanguageRow } from "@/types/database";

describe("languages API", () => {
  it("returns data and no error on success", async () => {
    const data: LanguageRow[] = [
      { code: "en", name: "English" },
      { code: "ru", name: "Russian" },
    ];
    vi.mocked(supabase.from).mockReturnValue(
      createSupabaseChain({ data, error: null }) as never,
    );
    const result = await getLanguages();
    expect(result.data).toEqual(data);
    expect(result.error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith("languages");
  });

  it("returns empty array and error when Supabase errors", async () => {
    const err = new Error("db error");
    vi.mocked(supabase.from).mockReturnValue(
      createSupabaseChain({ data: null, error: err }) as never,
    );
    const result = await getLanguages();
    expect(result.data).toEqual([]);
    expect(result.error).toBe(err);
  });

  it("returns empty array when data is null", async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSupabaseChain({ data: null, error: null }) as never,
    );
    const result = await getLanguages();
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });
});
