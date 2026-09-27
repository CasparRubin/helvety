import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CatalogCardFrame, ProductsCatalog } from "./products-catalog";

import type { StoreProductCategory } from "@helvety/shared/store-catalog";

const categories = [
  "file-tools",
  "sharepoint-apps",
] as const satisfies readonly StoreProductCategory[];

describe("ProductsCatalog", () => {
  it("renders server-provided cards on the first paint", () => {
    render(
      <ProductsCatalog categories={categories}>
        <CatalogCardFrame category="file-tools">Helvety PDF</CatalogCardFrame>
        <CatalogCardFrame category="sharepoint-apps">
          Helvety SPO Explorer
        </CatalogCardFrame>
      </ProductsCatalog>
    );

    expect(screen.getByText("Helvety PDF")).toBeInTheDocument();
    expect(screen.getByText("Helvety SPO Explorer")).toBeInTheDocument();
  });

  it("hides cards that do not match the category filter", async () => {
    render(
      <ProductsCatalog categories={categories}>
        <CatalogCardFrame category="file-tools">Helvety PDF</CatalogCardFrame>
        <CatalogCardFrame category="sharepoint-apps">
          Helvety SPO Explorer
        </CatalogCardFrame>
      </ProductsCatalog>
    );

    fireEvent.click(screen.getByRole("button", { name: /SharePoint Apps/i }));

    await waitFor(() => {
      expect(screen.getByText("Helvety PDF")).not.toBeVisible();
      expect(screen.getByText("Helvety SPO Explorer")).toBeVisible();
    });
  });

  it("lists all four ecosystem category filters", () => {
    render(
      <ProductsCatalog categories={categories}>
        <CatalogCardFrame category="file-tools">Helvety PDF</CatalogCardFrame>
      </ProductsCatalog>
    );

    expect(
      screen.queryByRole("button", { name: /Encryption Apps/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /File Tools/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Browser Extensions/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /SharePoint Apps/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Desktop Apps/i })
    ).toBeInTheDocument();
  });
});
