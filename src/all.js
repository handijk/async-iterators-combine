export async function* all(iterable, { lazy = false } = {}) {
  const results = Array.from(iterable, () => undefined);
  const intermediateResults = Array.from(iterable, () => undefined);
  const asyncIterators = Array.from(iterable, (asyncIterator, index) => [
    asyncIterator,
    index,
  ]);
  let count = asyncIterators.length;
  try {
    while (count) {
      await Promise.all(
        asyncIterators.map(async ([asyncIterator, index], currentIndex) => {
          const { done, value } = await asyncIterator.next();
          if (done) {
            asyncIterators.splice(currentIndex, 1);
            results[index] = value;
            count--;
            return { done, value };
          } else {
            intermediateResults[index] = value;
            return { done, value };
          }
        })
      );
      if (lazy && count !== results.length) {
        return results;
      }
      if (count) {
        yield intermediateResults;
      }
    }
  } finally {
    for (const [asyncIterator] of asyncIterators) {
      if (asyncIterator?.return) {
        asyncIterator.return();
      }
    }
  }
  return results;
}
