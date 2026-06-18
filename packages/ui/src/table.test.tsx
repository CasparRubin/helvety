import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

describe("Table", () => {
  it("renders semantic table primitives with data-slot markers", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Helvety</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByRole("table")).toHaveAttribute("data-slot", "table");
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute(
      "data-slot",
      "table-head"
    );
    expect(screen.getByRole("cell", { name: "Helvety" })).toHaveAttribute(
      "data-slot",
      "table-cell"
    );
  });
});
