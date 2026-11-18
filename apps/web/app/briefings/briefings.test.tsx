import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { BriefingArticle, BriefingIndex } from "@/components/briefing-article";
import { BRIEFINGS } from "@/content/briefings";

const pilot = BRIEFINGS[0];

describe("briefing pages", () => {
  it("lists the pilot briefing", () => {
    render(<BriefingIndex briefings={BRIEFINGS} />);

    expect(
      screen.getByRole("link", { name: "Energy-based reasoners" })
    ).toHaveAttribute(
      "href",
      "/briefings/energy-based-reasoners-duke-uiuc-harvard-reports-1-8-million-parameters-99-9-percent-sudoku-extreme-345-times-less-inference-compute"
    );
    expect(screen.getByText(/1\.8 million parameters/)).toBeTruthy();
  });

  it("links the paper and the thread, and leaves platform links off until they exist", () => {
    if (!pilot) {
      throw new Error("Pilot briefing is missing.");
    }
    render(<BriefingArticle briefing={pilot} />);

    expect(
      screen.getByRole("link", { name: "Energy-Based Reasoners" })
    ).toHaveAttribute("href", "https://energy-based-reasoners.github.io/");
    expect(screen.getByRole("link", { name: "Hacker News" })).toHaveAttribute(
      "href",
      "https://news.ycombinator.com/item?id=50543989"
    );
    expect(screen.getByRole("link", { name: "saithound" })).toHaveAttribute(
      "href",
      "https://news.ycombinator.com/item?id=50544356"
    );
    expect(
      screen.getByRole("link", { name: "Classical energies paper" })
    ).toHaveAttribute("href", "https://arxiv.org/abs/2611.17309");
    expect(
      screen.getByRole("heading", { name: "Who is on the paper" })
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "William Xingxu Chen" })
    ).toHaveAttribute("href", "https://wwillchen.github.io/");
    expect(screen.getByRole("link", { name: "Heng Ji" })).toHaveAttribute(
      "href",
      "https://csl.illinois.edu/directory/faculty/hengji"
    );
    expect(screen.getByText(/PhD candidate/)).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "From the Hacker News thread" })
    ).toBeTruthy();
    expect(screen.getByText(/from the Hacker News discussion/)).toBeTruthy();
    expect(screen.queryByRole("link", { name: "YouTube" })).toBeNull();
  });

  it("shows a platform link only when the briefing has one", () => {
    if (!pilot) {
      throw new Error("Pilot briefing is missing.");
    }
    render(
      <BriefingArticle
        briefing={{
          ...pilot,
          platforms: { youtube: "https://www.youtube.com/watch?v=pilot" },
        }}
      />
    );

    expect(screen.getByRole("link", { name: "YouTube" })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=pilot"
    );
    expect(screen.queryByRole("link", { name: "Instagram" })).toBeNull();
  });
});
