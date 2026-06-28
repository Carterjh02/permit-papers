export function getValueFromPath<
  T extends Record<string, unknown>,
  R = unknown
>(obj: T, path: string): R | undefined {
  const parts = path.split(".");

  let current: unknown = obj;

  for (const part of parts) {
    if (
      typeof current === "object" &&
      current !== null &&
      part in (current as Record<string, unknown>)
    ) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current as R;
}
