import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DEFAULT_CATEGORIES } from "@/lib/config/default-categories";

import { ContactList } from "./contact-list";

import type { Contact } from "@/lib/types";

const baseContact = (overrides: Partial<Contact>): Contact => ({
  id: "c1",
  user_id: "user-1",
  first_name: "Ada",
  last_name: "Lovelace",
  description: null,
  email: "ada@example.com",
  phone: null,
  birthday: null,
  notes: null,
  category_id: "personal",
  sort_order: 0,
  created_at: "2025-01-01T12:00:00.000Z",
  updated_at: "2025-01-01T12:00:00.000Z",
  ...overrides,
});

describe("ContactList", () => {
  it("keeps visible rows rendered while a background refresh is active", () => {
    render(
      <ContactList
        contacts={[baseContact({ id: "visible" })]}
        isLoading={false}
        isRefreshing
        error={null}
        categories={DEFAULT_CATEGORIES}
      />
    );

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("shows category section headers with zero counts when there are no contacts", () => {
    render(
      <ContactList
        contacts={[]}
        isLoading={false}
        error={null}
        categories={DEFAULT_CATEGORIES}
      />
    );

    expect(
      screen.getByRole("button", { name: /Personal\(0\)/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Work\(0\)/ })
    ).toBeInTheDocument();
  });

  it("does not show the global empty message when categories exist but the address book is empty", () => {
    render(
      <ContactList
        contacts={[]}
        isLoading={false}
        error={null}
        categories={DEFAULT_CATEGORIES}
      />
    );

    expect(screen.queryByText("No contacts yet")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Create your first contact to get started.")
    ).not.toBeInTheDocument();
  });

  it("shows the global empty message only when there are no categories and no contacts", () => {
    render(
      <ContactList
        contacts={[]}
        isLoading={false}
        error={null}
        categories={[]}
      />
    );

    expect(screen.getByText("No contacts yet")).toBeInTheDocument();
    expect(
      screen.getByText("Create your first contact to get started.")
    ).toBeInTheDocument();
  });

  it("shows emptySearchMessage instead of category shells when filtered list is empty", () => {
    render(
      <ContactList
        contacts={[]}
        isLoading={false}
        error={null}
        categories={DEFAULT_CATEGORIES}
        emptySearchMessage="No contacts match your search."
      />
    );

    expect(
      screen.getByText("No contacts match your search.")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Personal\(0\)/ })
    ).not.toBeInTheDocument();
  });

  it("renders contacts in a flat list when no categories are configured", () => {
    const contacts = [
      baseContact({
        id: "a",
        first_name: "Grace",
        last_name: "Hopper",
        sort_order: 0,
      }),
    ];

    render(
      <ContactList
        contacts={contacts}
        isLoading={false}
        error={null}
        categories={[]}
      />
    );

    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Personal\(0\)/ })
    ).not.toBeInTheDocument();
  });
});
