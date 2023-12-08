export class AsyncIteratorsCombine {
  #closed = false;
  #iterable = null;
  #returnAsyncIterators = null;
  #method = null;
  #lazy = null;
  #nextPromises = null;
  #nextIndexes = null;
  #indexes = null;
  #doneValues = [];
  #values = [];

  set method(method) {
    this.#method = method;
  }

  get method() {
    return this.#method;
  }

  get values() {
    return this.#values;
  }

  constructor(
    iterable,
    {
      returnAsyncIterators = Array.from(iterable),
      method = 'all',
      lazy = false,
      initialValue = undefined,
    } = {}
  ) {
    this.#iterable = Array.from(iterable);
    this.#returnAsyncIterators = new Set(returnAsyncIterators);
    this.#method = method;
    this.#lazy = lazy;
    this.#nextPromises = [];
    this.#nextIndexes = Array.from(iterable, (_asyncIterator, index) => index);
    this.#indexes = Array.from(iterable, (_asyncIterable) => 0);
    this.#values = Array.from(iterable, (_asyncIterable) => initialValue);
    this.#doneValues = Array.from(iterable, (_asyncIterable) => initialValue);
  }

  #returnedAt(index) {
    if (this.#returnAsyncIterators.has(this.#iterable[index])) {
      this.#returnAsyncIterators.delete(this.#iterable[index]);
    }
  }

  #handleResult({ value, done, index, absoluteIndex }) {
    this.#nextPromises[absoluteIndex] = null;
    if (done) {
      if (this.#lazy) {
        return this.return(value);
      } else {
        this.#doneValues[index] = value;
        if (
          !this.#nextPromises.filter(Boolean).length &&
          !this.#nextIndexes.length
        ) {
          return this.return(this.#doneValues);
        }
        this.#returnedAt(index);
      }
    } else {
      this.#nextIndexes.push(index);
      if (!done) {
        this.#values[index] = value;
      }
    }
    return { value, done: false, index };
  }

  async next(...args) {
    if (this.#closed) {
      return Promise.resolve({ value: undefined, done: true });
    }
    for (const index of this.#nextIndexes) {
      const currentLength = this.#nextPromises.length;
      const nextPromise = this.#iterable[index]
        .next(this.#indexes[index], ...args)
        .then(
          (result) => ({ ...result, index, absoluteIndex: currentLength }),
          (error) => {
            this.#returnedAt(index);
            throw error;
          }
        );
      this.#nextPromises.push(nextPromise);
      this.#indexes[index]++;
    }
    this.#nextIndexes = [];
    if (!this.#nextPromises.filter(Boolean).length) {
      return this.return(this.#doneValues);
    }
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const result = await Promise[this.#method](
          this.#nextPromises.filter(Boolean)
        );
        if (this.#method === 'all' || this.#method === 'allSettled') {
          const finalResult =
            this.#method === 'allSettled'
              ? result.map(({ value: { value, ...rest }, status }) => ({
                  value: { value, status },
                  ...rest,
                }))
              : result;
          for (const item of finalResult) {
            const { done, value } = await this.#handleResult(item);
            if (done) {
              return { done, value };
            }
          }
          return {
            done: false,
            value: this.#values,
          };
        } else if (this.#method === 'race' || this.#method === 'any') {
          const { done, value } = await this.#handleResult(result);
          if (done) {
            return { done, value };
          }
          if (!result.done) {
            return { done, value };
          }
        }
      } catch (error) {
        return this.throw(error);
      }
    }
  }

  async return(value) {
    if (this.#closed) {
      return { done: true, value };
    }
    await Promise.all(
      Array.from(this.#returnAsyncIterators)
        .filter((asyncIterator) => asyncIterator?.return)
        .map((asyncIterator) => asyncIterator.return(value))
    );
    this.#closed = true;
    return Promise.resolve({ done: true, value });
  }

  async throw(error) {
    await this.return();
    return Promise.reject(error);
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}
