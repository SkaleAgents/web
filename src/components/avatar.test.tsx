import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Avatar } from "@/components/avatar";

afterEach(cleanup);

it("shows the profile photo without a referrer and falls back to initials when it fails", () => {
  const { container } = render(<Avatar name="Harun Rayhan" kind="person" src="https://lh3.googleusercontent.com/a/photo" />);
  const image = container.querySelector("img")!;
  expect(image).toHaveAttribute("referrerpolicy", "no-referrer");
  expect(image).toHaveAttribute("alt", "");
  fireEvent.error(image);
  expect(container.querySelector("img")).toBeNull();
  expect(container).toHaveTextContent("HR");
});

it("shows initials when there is no photo", () => {
  const { container } = render(<Avatar name="Harun Rayhan" kind="person" />);
  expect(container.querySelector("img")).toBeNull();
  expect(container).toHaveTextContent("HR");
});
