import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressPage } from "@/pages/ProgressPage/ProgressPage";

describe("ProgressPage", () => {
  it("renders Progress heading and placeholder text", () => {
    render(<ProgressPage />);
    expect(
      screen.getByRole("heading", { name: "Progress" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Stats, streaks and achievements will go here/),
    ).toBeInTheDocument();
  });
});
