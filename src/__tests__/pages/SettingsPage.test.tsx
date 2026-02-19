import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsPage } from "@/pages/SettingsPage/SettingsPage";
import { useUserLanguages } from "@/hooks/useUserLanguages";

const mockAddMutate = vi.fn();
const mockRemoveMutate = vi.fn();
let addMutationState = { isPending: false, isError: false };

vi.mock("@/stores/authStore", () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: "user-1" } }),
}));
vi.mock("@/hooks/useUserLanguages", () => ({
  useUserLanguages: vi.fn(),
  useAddBidirectionalPair: () => ({
    mutate: mockAddMutate,
    get isPending() {
      return addMutationState.isPending;
    },
    get isError() {
      return addMutationState.isError;
    },
  }),
  useRemoveUserLanguagesByIds: () => ({
    mutate: mockRemoveMutate,
    isPending: false,
  }),
}));
vi.mock("@/lib/errors", () => ({
  isSupabaseTableMissingError: (err: Error & { message?: string }) =>
    err?.message === "TABLE_MISSING",
}));

const useUserLanguagesMock = vi.mocked(useUserLanguages);

type UseUserLanguagesResult = ReturnType<typeof useUserLanguages>;

/** Minimal shape that SettingsPage reads; cast to full UseQueryResult for mock. */
interface UserLanguagesQueryState {
  data:
    | Array<{
        id: string;
        user_id: string;
        native_code: string;
        learning_code: string;
      }>
    | undefined;
  isLoading: boolean;
  error: Error | null;
  isError: boolean;
  isSuccess: boolean;
  isPending: boolean;
  status: string;
  refetch: ReturnType<typeof vi.fn>;
}

const defaultQueryState: UserLanguagesQueryState = {
  data: [],
  isLoading: false,
  error: null,
  isError: false,
  isSuccess: true,
  isPending: false,
  status: "success",
  refetch: vi.fn(),
};

function createQueryState(
  overrides: Partial<UserLanguagesQueryState> = {},
): UseUserLanguagesResult {
  return {
    ...defaultQueryState,
    ...overrides,
  } as unknown as UseUserLanguagesResult;
}

const onePairData = [
  {
    id: "ul1",
    user_id: "user-1",
    native_code: "en",
    learning_code: "ru",
  },
];

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUserLanguagesMock.mockReturnValue(createQueryState());
  });

  it("renders Settings heading and language pairs section", () => {
    render(<SettingsPage />);
    expect(
      screen.getByRole("heading", { name: "Settings" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Language pairs" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Choose which language pairs you want to learn/),
    ).toBeInTheDocument();
  });

  it("shows no language pairs message when list is empty", () => {
    render(<SettingsPage />);
    expect(
      screen.getByText("No language pairs yet. Add one below."),
    ).toBeInTheDocument();
  });

  it("shows loading state when useUserLanguages is loading", () => {
    useUserLanguagesMock.mockReturnValue(
      createQueryState({
        data: undefined,
        isLoading: true,
        isSuccess: false,
        isPending: true,
        status: "pending",
      }),
    );
    render(<SettingsPage />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("shows error alert when useUserLanguages returns error", () => {
    useUserLanguagesMock.mockReturnValue(
      createQueryState({
        data: undefined,
        error: new Error("Failed to load"),
        isError: true,
        isSuccess: false,
        status: "error",
      }),
    );
    render(<SettingsPage />);
    expect(
      screen.getByText(
        "Failed to load language pairs. Check your connection and try again.",
      ),
    ).toBeInTheDocument();
  });

  it("shows table missing message when error is table missing", () => {
    useUserLanguagesMock.mockReturnValue(
      createQueryState({
        data: undefined,
        error: new Error("TABLE_MISSING"),
        isError: true,
        isSuccess: false,
        status: "error",
      }),
    );
    render(<SettingsPage />);
    expect(
      screen.getByText(
        /We couldn't load language pairs. Please refresh the page/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("If the problem continues, try refreshing the page."),
    ).toBeInTheDocument();
  });

  it("shows existing language pairs with remove button", () => {
    useUserLanguagesMock.mockReturnValue(
      createQueryState({ data: onePairData }),
    );
    render(<SettingsPage />);
    expect(screen.getByText("Russian ↔ English")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove Russian ↔ English" }),
    ).toBeInTheDocument();
  });

  it("opens confirm dialog when remove is clicked and calls remove on confirm", () => {
    useUserLanguagesMock.mockReturnValue(
      createQueryState({ data: onePairData }),
    );
    render(<SettingsPage />);
    fireEvent.click(
      screen.getByRole("button", { name: "Remove Russian ↔ English" }),
    );
    expect(
      screen.getByRole("dialog", { name: /remove language pair/i }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(mockRemoveMutate).toHaveBeenCalledWith(
      ["ul1"],
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("calls add mutation when Add is clicked with selected pair", () => {
    render(<SettingsPage />);
    const addButton = screen.getByRole("button", { name: "Add" });
    expect(addButton).toBeInTheDocument();
    fireEvent.click(addButton);
    expect(mockAddMutate).toHaveBeenCalledWith({
      userId: "user-1",
      key: "en-ru",
    });
  });

  it("shows virtual pair hint when user has both en-ru and en-sr", () => {
    const enRuAndEnSr = [
      { id: "ul1", user_id: "user-1", native_code: "en", learning_code: "ru" },
      { id: "ul2", user_id: "user-1", native_code: "en", learning_code: "sr" },
    ];
    useUserLanguagesMock.mockReturnValue(
      createQueryState({ data: enRuAndEnSr }),
    );
    render(<SettingsPage />);
    expect(
      screen.getByText(
        /Available when you have Russian↔English and Serbian↔English/,
      ),
    ).toBeInTheDocument();
  });

  it("shows add error message when add mutation fails", () => {
    addMutationState = { isPending: false, isError: true };
    useUserLanguagesMock.mockReturnValue(createQueryState({ data: [] }));
    render(<SettingsPage />);
    expect(screen.getByText("Could not add. Try again.")).toBeInTheDocument();
    addMutationState = { isPending: false, isError: false };
  });
});
