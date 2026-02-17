/**
 * When running `suspend()` from react-suspend a function may throw a Promise
 * causing unexpected behavior when catching.
 * @param block Your block of code that uses suspend
 * @param onError (optional) How to handle a regular Error
 * @returns Whatever is returned by the block if it succeeds, otherwise whatever is resolved by onError if defined
 * @throws rethrows the caught Promise to comply with Suspense logic
 */
export function tryWithSuspend<T, E>(
  block: () => T,
  onError?: (error: Error) => E
): T | E | undefined {
  try {
    return block()
  } catch (errorOrPromise) {
    if (errorOrPromise instanceof Promise) {
      // react-suspend will throw a Promise
      throw errorOrPromise
    }
    return onError ? onError(errorOrPromise as Error) : undefined
  }
}
