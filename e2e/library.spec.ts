import { test, expect } from "@playwright/test";
import { loginWithCredentials, hasE2EAuthEnv } from "./helpers/auth";

test.describe("Library (unauthenticated)", () => {
  test("redirects to login when visiting /library", async ({ page }) => {
    await page.goto("/library");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });
});

test.describe("Library (vocabulary flows)", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !hasE2EAuthEnv(),
      "E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set for authenticated E2E",
    );
    await loginWithCredentials(
      page,
      process.env.E2E_TEST_EMAIL!,
      process.env.E2E_TEST_PASSWORD!,
    );
  });

  test("add word, see in list, edit, delete", async ({ page }) => {
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    const pairSelect = page.getByLabel("Add language pair");
    if (await pairSelect.isVisible()) {
      await pairSelect.click();
      await page
        .getByRole("option", { name: /Russian.*English|English.*Russian/ })
        .first()
        .click();
      await page.getByRole("button", { name: "Add" }).click();
      await expect(page.getByText(/Russian|English/)).toBeVisible({
        timeout: 5000,
      });
    }

    await page.getByRole("link", { name: "My Library" }).click();
    await expect(
      page.getByRole("heading", { name: "My Library" }),
    ).toBeVisible();

    const mayShowNoPairs = page.getByText("Add at least one language pair");
    if (await mayShowNoPairs.isVisible()) {
      test.skip(
        true,
        "Test user has no language pair; add one in Settings first",
      );
    }

    await expect(
      page.getByTestId("library-list").or(page.getByTestId("library-empty")),
    ).toBeVisible({ timeout: 15000 });

    const wordInput = page.getByLabel("Word").first();
    const translationInput = page.getByLabel("Translation").first();
    await wordInput.fill("e2e-test-word");
    await translationInput.fill("e2e-test-translation");

    const libraryPairSelect = page.getByLabel("Language pair").first();
    await libraryPairSelect.click();
    await page
      .getByRole("option", { name: /Russian.*English|English.*Russian/ })
      .first()
      .click();

    const directionSelect = page.getByLabel("Direction").first();
    await directionSelect.click();
    await page
      .getByRole("option", { name: /Russian.*English|English.*Russian/ })
      .first()
      .click();

    await page.getByRole("button", { name: "Add" }).click();
    await expect(
      page.getByText("e2e-test-word — e2e-test-translation"),
    ).toBeVisible({ timeout: 8000 });

    const list = page.getByTestId("library-list");
    await expect(list).toBeVisible();
    const editButton = page.getByRole("button", { name: "Edit" }).first();
    await editButton.click();
    await expect(
      page.getByRole("dialog").getByRole("heading", { name: "Edit word" }),
    ).toBeVisible();
    const editWordField = page.getByRole("dialog").getByLabel("Word");
    await editWordField.clear();
    await editWordField.fill("e2e-test-word-edited");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Save" })
      .click();
    await expect(
      page.getByText("e2e-test-word-edited — e2e-test-translation"),
    ).toBeVisible({ timeout: 5000 });

    const deleteButton = page.getByRole("button", { name: "Delete" }).first();
    await deleteButton.click();
    await expect(
      page.getByRole("dialog").getByText(/Remove this word/),
    ).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Remove" })
      .click();
    await expect(
      page.getByText("e2e-test-word-edited — e2e-test-translation"),
    ).toBeHidden({ timeout: 5000 });
  });
});
