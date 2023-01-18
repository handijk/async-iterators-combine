export async function* race(
  iterable,
  { combine = false, lazy = false, eager = false, yieldIndex = false } = {}
) {
  const nextPromises = [];
  const promiseMap = new WeakMap();

  const setPromise = (asyncIterator, index) => {
    const promise = asyncIterator.next().then(({ value, done }) => ({
      index,
      promise,
      result: { value, done },
    }));
    promiseMap.set(promise, asyncIterator);
    nextPromises.push(promise);
  };

  const yieldValue = (result) => {
    if (yieldIndex) {
      return [result, yieldedIndex];
    } else {
      return result;
    }
  };

  const results = Array.from(iterable, () => undefined);
  const intermediateResults = Array.from(iterable, () => undefined);
  const asyncIterators = Array.from(iterable);
  const waiting = Array.from(iterable, () => true);
  let lastResult = undefined;
  let yieldedIndex;

  asyncIterators.forEach(setPromise);

  try {
    while (nextPromises.length) {
      const { index, result, promise } = await Promise.race(nextPromises);
      yieldedIndex = index;
      promiseMap.delete(promise);
      nextPromises.splice(nextPromises.indexOf(promise), 1);
      if (result.done) {
        results[index] = result.value;
        if (lazy) {
          if (combine) {
            return results;
          } else {
            return result.value;
          }
        }
        lastResult = result.value;
      } else {
        setPromise(asyncIterators[index], index);
        intermediateResults[index] = result.value;
        waiting[index] = false;
        if (!combine || eager || waiting.filter(Boolean).length === 0) {
          if (combine) {
            yield yieldValue(intermediateResults);
          } else {
            yield yieldValue(result.value);
          }
        }
      }
    }
  } finally {
    for (const promise of nextPromises) {
      const asyncIterator = promiseMap.get(promise);
      if (asyncIterator?.return) {
        asyncIterator.return();
      }
    }
  }
  if (combine) {
    return results;
  } else {
    return lastResult;
  }
}
