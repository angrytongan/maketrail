import { describe, expect, it } from "vitest";
import { createHistoryStack, pushState, redoState, undoState } from "./stack";

describe("history stack", () => {
  it("undoes to the pushed state and moves the current state onto redo", () => {
    const stack = createHistoryStack<string>();
    pushState(stack, "a");
    expect(undoState(stack, "b")).toBe("a");
    expect(stack.redoStack).toEqual(["b"]);
  });

  it("redoes back to the state undo moved onto redo", () => {
    const stack = createHistoryStack<string>();
    pushState(stack, "a");
    undoState(stack, "b");
    expect(redoState(stack, "a")).toBe("b");
    expect(stack.undoStack).toEqual(["a"]);
  });

  it("returns undefined when undoing with nothing on the stack", () => {
    const stack = createHistoryStack<string>();
    expect(undoState(stack, "a")).toBeUndefined();
  });

  it("returns undefined when redoing with nothing on the stack", () => {
    const stack = createHistoryStack<string>();
    expect(redoState(stack, "a")).toBeUndefined();
  });

  it("clears redo when a new state is pushed", () => {
    const stack = createHistoryStack<string>();
    pushState(stack, "a");
    undoState(stack, "b");
    expect(stack.redoStack).toEqual(["b"]);
    pushState(stack, "c");
    expect(stack.redoStack).toEqual([]);
  });

  it("supports multiple undo/redo steps in order", () => {
    const stack = createHistoryStack<number>();
    pushState(stack, 1);
    pushState(stack, 2);
    pushState(stack, 3);
    expect(undoState(stack, 4)).toBe(3);
    expect(undoState(stack, 3)).toBe(2);
    expect(undoState(stack, 2)).toBe(1);
    expect(undoState(stack, 1)).toBeUndefined();
    expect(redoState(stack, 1)).toBe(2);
    expect(redoState(stack, 2)).toBe(3);
    expect(redoState(stack, 3)).toBe(4);
  });
});
