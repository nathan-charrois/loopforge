export type SelectorType<S, T> = (snapshot: S) => T

export function createSnapshot<S, T>(
  getSnapshot: () => S,
  selector: SelectorType<S, T>,
): () => T {
  return () => selector(getSnapshot())
}
