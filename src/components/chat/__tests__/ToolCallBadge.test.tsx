import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { getToolCallLabel, ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// --- getToolCallLabel ---

test("str_replace_editor create", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "create", path: "/App.jsx" })).toBe("Creating /App.jsx");
});

test("str_replace_editor str_replace", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "str_replace", path: "/components/Card.jsx" })).toBe("Editing /components/Card.jsx");
});

test("str_replace_editor insert", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "insert", path: "/file.tsx" })).toBe("Editing /file.tsx");
});

test("str_replace_editor view", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "view", path: "/file.tsx" })).toBe("Reading /file.tsx");
});

test("str_replace_editor undo_edit", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "undo_edit", path: "/file.tsx" })).toBe("Undoing edit in /file.tsx");
});

test("file_manager rename", () => {
  expect(getToolCallLabel("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" })).toBe("Renaming /old.jsx");
});

test("file_manager delete", () => {
  expect(getToolCallLabel("file_manager", { command: "delete", path: "/file.jsx" })).toBe("Deleting /file.jsx");
});

test("unknown tool falls back to tool name", () => {
  expect(getToolCallLabel("some_other_tool", { command: "do_thing" })).toBe("some_other_tool");
});

// --- ToolCallBadge component ---

test("pending state renders spinner and label", () => {
  render(
    <ToolCallBadge
      toolInvocation={{ toolName: "str_replace_editor", args: { command: "create", path: "/App.jsx" }, state: "call" }}
    />
  );

  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
  // spinner is present (animate-spin class)
  const spinner = document.querySelector(".animate-spin");
  expect(spinner).not.toBeNull();
  // no green dot
  const greenDot = document.querySelector(".bg-emerald-500");
  expect(greenDot).toBeNull();
});

test("result state renders green dot and label", () => {
  render(
    <ToolCallBadge
      toolInvocation={{ toolName: "str_replace_editor", args: { command: "create", path: "/App.jsx" }, state: "result", result: "File created: /App.jsx" }}
    />
  );

  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
  // green dot present
  const greenDot = document.querySelector(".bg-emerald-500");
  expect(greenDot).not.toBeNull();
  // no spinner
  const spinner = document.querySelector(".animate-spin");
  expect(spinner).toBeNull();
});

test("file_manager delete shows Deleting label", () => {
  render(
    <ToolCallBadge
      toolInvocation={{ toolName: "file_manager", args: { command: "delete", path: "/old.jsx" }, state: "result", result: { success: true } }}
    />
  );
  expect(screen.getByText("Deleting /old.jsx")).toBeDefined();
});

test("unknown tool shows tool name as label", () => {
  render(
    <ToolCallBadge
      toolInvocation={{ toolName: "mystery_tool", args: {}, state: "call" }}
    />
  );
  expect(screen.getByText("mystery_tool")).toBeDefined();
});
