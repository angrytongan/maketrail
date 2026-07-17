export interface HistoryStack<T> {
  undoStack: T[];
  redoStack: T[];
}

export function createHistoryStack<T>(): HistoryStack<T> {
  return { undoStack: [], redoStack: [] };
}

/** Records a new undoable step. Clears redo — redoing after a fresh edit would resurrect a divergent future. */
export function pushState<T>(stack: HistoryStack<T>, before: T): void {
  stack.undoStack.push(before);
  stack.redoStack = [];
}

/** Pops the most recent undo step (if any), pushing `current` onto redo so the change can be replayed forward. */
export function undoState<T>(stack: HistoryStack<T>, current: T): T | undefined {
  const prev = stack.undoStack.pop();
  if (prev === undefined) return undefined;
  stack.redoStack.push(current);
  return prev;
}

/** Pops the most recent redo step (if any), pushing `current` back onto undo. */
export function redoState<T>(stack: HistoryStack<T>, current: T): T | undefined {
  const next = stack.redoStack.pop();
  if (next === undefined) return undefined;
  stack.undoStack.push(current);
  return next;
}
