"use client";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TiptapEditor } from "./tiptap-editor";

describe("TiptapEditor toolbar accessibility", () => {
  it("exposes accessible names for icon-only toolbar buttons", async () => {
    render(<TiptapEditor content={null} />);

    expect(
      await screen.findByRole("button", { name: "Bold" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Strikethrough" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Link" })
    ).toBeInTheDocument();
  });
});
