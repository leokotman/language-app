import { describe, it, expect, vi } from "vitest";
import { createSupabaseChain } from "../helpers/supabaseMock";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { upsertProfile } from "@/api/profiles";
import { supabase } from "@/lib/supabase";

describe("profiles API", () => {
  it("calls supabase upsert with profile and updated_at", async () => {
    const chain = createSupabaseChain({ error: null }) as {
      upsert: ReturnType<typeof vi.fn>;
    };
    vi.mocked(supabase.from).mockReturnValue(chain as never);
    const result = await upsertProfile({
      id: "user-1",
      email: "u@example.com",
      display_name: "User One",
    });
    expect(result.error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith("profiles");
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user-1",
        email: "u@example.com",
        display_name: "User One",
        updated_at: expect.any(String),
      }),
      { onConflict: "id" },
    );
  });

  it("returns error when Supabase upsert fails", async () => {
    const err = new Error("upsert failed");
    vi.mocked(supabase.from).mockReturnValue(
      createSupabaseChain({ error: err }) as never,
    );
    const result = await upsertProfile({ id: "user-1" });
    expect(result.error).toBe(err);
  });
});
