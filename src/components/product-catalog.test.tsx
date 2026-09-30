import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductCatalog } from "./product-catalog";

describe("product discovery", () => {
  it("combines category and case-insensitive search, and lets visitors recover from no matches", () => {
    render(<ProductCatalog />);
    expect(screen.getAllByRole("article")).toHaveLength(6);
    expect(screen.queryByRole("heading", { name: "SkaleAgents" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Commerce" }));
    expect(screen.getAllByRole("article")).toHaveLength(2);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: " SHOPIFY " } });
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(within(screen.getByRole("article")).getByRole("heading", { name: "Appnary" })).toBeVisible();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "missing-product" } });
    expect(screen.queryAllByRole("article")).toHaveLength(0);
    expect(screen.getByRole("status")).toHaveTextContent("0 products shown");
    fireEvent.click(screen.getByRole("button", { name: "Reset filters" }));
    expect(screen.getAllByRole("article")).toHaveLength(6);
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });
});
