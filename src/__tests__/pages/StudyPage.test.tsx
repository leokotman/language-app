import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { StudyPage } from "@/pages/StudyPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const authState = vi.hoisted(() => ({
  user: null as { id: string } | null,
}));
const userLangsState = vi.hoisted(() => ({
  data: [] as { native_code: string; learning_code: string }[],
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null }) => unknown) =>
    selector({ user: authState.user }),
}));
vi.mock("@/hooks/useUserLanguages", () => ({
  useUserLanguages: () => ({
    data: userLangsState.data,
    isLoading: false,
    error: null,
  }),
}));
vi.mock("@/hooks/useVocabulary", () => ({
  useDueToday: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
  useUpdateUserVocabulary: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));
vi.mock("@/hooks/useAudioRecorder", () => ({
  useAudioRecorder: () => ({
    isRecording: false,
    recordingBlob: null,
    recordingError: null,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
  }),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
}

describe("StudyPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = null;
    userLangsState.data = [];
  });

  it("renders SignInAlert when user is not signed in", () => {
    authState.user = null;
    render(<StudyPage />, { wrapper });
    expect(screen.getByRole("heading", { name: "Study" })).toBeInTheDocument();
    expect(
      screen.getByText(/sign in to study your vocabulary/i),
    ).toBeInTheDocument();
  });

  it("renders study UI with NoCardsDue when signed in and no cards due", () => {
    authState.user = { id: "user-1" };
    userLangsState.data = [{ native_code: "en", learning_code: "ru" }];
    render(<StudyPage />, { wrapper });
    expect(screen.getByRole("heading", { name: "Study" })).toBeInTheDocument();
    expect(
      screen.getByText(/no cards due today for this language pair/i),
    ).toBeInTheDocument();
  });
});
