import { vi } from "vitest";

export interface SupabaseQueryResult {
  data?: unknown;
  error?: Error | null;
}

/**
 * Creates a thenable chain that mimics Supabase's fluent API.
 * Awaiting the chain resolves to the given result.
 * Use with vi.mocked(supabase.from).mockReturnValue(createSupabaseChain({ data, error })).
 */
export function createSupabaseChain(result: SupabaseQueryResult = {}): unknown {
  const chain = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    then(resolve: (value: { data: unknown; error: Error | null }) => void) {
      return Promise.resolve({
        data: result.data ?? null,
        error: result.error ?? null,
      }).then(resolve);
    },
  };
  return chain;
}
