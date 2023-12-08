import { describe, test, expect, vi } from 'vitest';
import { AsyncIteratorsCombine } from './async-iterators-combine.js';

describe('async-iterators-combine', () => {
  const createTimeoutPromise = (delay) => {
    return new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
  };

  async function* createAsyncIterable({ i, delay, throwErrorAt }) {
    while (i--) {
      if (delay) {
        await createTimeoutPromise(delay);
      }
      if (i === throwErrorAt) {
        throw new Error(`Error thrown at ${i}`);
      }
      yield i;
    }
    return 'final';
  }

  test('all two async iterables and return when the last async iterator returns', async () => {
    const combination = new AsyncIteratorsCombine([
      createAsyncIterable({ i: 6, delay: 50 }),
      createAsyncIterable({ i: 3, delay: 70 }),
    ]);
    expect(await combination.next()).toEqual({
      done: false,
      value: [5, 2],
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: [4, 1],
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: [3, 0],
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: [2, 0],
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: [1, 0],
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: [0, 0],
    });
    expect(await combination.next()).toEqual({
      done: true,
      value: ['final', 'final'],
    });
  });

  test('allSettled two async iterables and return when the last async iterator returns', async () => {
    const combination = new AsyncIteratorsCombine(
      [
        createAsyncIterable({ i: 6, delay: 50 }),
        createAsyncIterable({ i: 3, delay: 70 }),
      ],
      { method: 'allSettled' }
    );
    expect(await combination.next()).toEqual({
      done: false,
      value: [
        {
          status: 'fulfilled',
          value: 5,
        },
        {
          status: 'fulfilled',
          value: 2,
        },
      ],
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: [
        {
          status: 'fulfilled',
          value: 4,
        },
        {
          status: 'fulfilled',
          value: 1,
        },
      ],
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: [
        {
          status: 'fulfilled',
          value: 3,
        },
        {
          status: 'fulfilled',
          value: 0,
        },
      ],
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: [
        {
          status: 'fulfilled',
          value: 2,
        },
        {
          status: 'fulfilled',
          value: 0,
        },
      ],
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: [
        {
          status: 'fulfilled',
          value: 1,
        },
        {
          status: 'fulfilled',
          value: 0,
        },
      ],
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: [
        {
          status: 'fulfilled',
          value: 0,
        },
        {
          status: 'fulfilled',
          value: 0,
        },
      ],
    });
    expect(await combination.next()).toEqual({
      done: true,
      value: [
        {
          status: 'fulfilled',
          value: 'final',
        },
        {
          status: 'fulfilled',
          value: 'final',
        },
      ],
    });
  });

  test('race two async iterables and return when the last async iterable returns', async () => {
    const combination = new AsyncIteratorsCombine(
      [
        createAsyncIterable({ i: 6, delay: 50 }),
        createAsyncIterable({ i: 3, delay: 70 }),
      ],
      { method: 'race' }
    );
    expect(await combination.next()).toEqual({
      done: false,
      value: 5,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 2,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 4,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 1,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 3,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 2,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 0,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 1,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 0,
    });
    expect(await combination.next()).toEqual({
      done: true,
      value: ['final', 'final'],
    });
  });

  test('any two async iterables and return when the last async iterable returns', async () => {
    const combination = new AsyncIteratorsCombine(
      [
        createAsyncIterable({ i: 6, delay: 50 }),
        createAsyncIterable({ i: 3, delay: 70 }),
      ],
      { method: 'any' }
    );
    expect(await combination.next()).toEqual({
      done: false,
      value: 5,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 2,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 4,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 1,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 3,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 2,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 0,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 1,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 0,
    });
    expect(await combination.next()).toEqual({
      done: true,
      value: ['final', 'final'],
    });
  });

  test('all two async iterables and return when the first async iterator returns', async () => {
    const combination = new AsyncIteratorsCombine(
      [
        createAsyncIterable({ i: 6, delay: 50 }),
        createAsyncIterable({ i: 3, delay: 70 }),
      ],
      { lazy: true }
    );
    expect(await combination.next()).toEqual({ done: false, value: [5, 2] });
    expect(await combination.next()).toEqual({ done: false, value: [4, 1] });
    expect(await combination.next()).toEqual({ done: false, value: [3, 0] });
    expect(await combination.next()).toEqual({
      done: true,
      value: 'final',
    });
  });

  test('allSettled two async iterables and return when the first async iterator returns', async () => {
    const combination = new AsyncIteratorsCombine(
      [
        createAsyncIterable({ i: 6, delay: 50 }),
        createAsyncIterable({ i: 3, delay: 70 }),
      ],
      { lazy: true, method: 'allSettled' }
    );
    expect(await combination.next()).toEqual({
      done: false,
      value: [
        {
          status: 'fulfilled',
          value: 5,
        },
        {
          status: 'fulfilled',
          value: 2,
        },
      ],
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: [
        {
          status: 'fulfilled',
          value: 4,
        },
        {
          status: 'fulfilled',
          value: 1,
        },
      ],
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: [
        {
          status: 'fulfilled',
          value: 3,
        },
        {
          status: 'fulfilled',
          value: 0,
        },
      ],
    });
    expect(await combination.next()).toEqual({
      done: true,
      value: {
        status: 'fulfilled',
        value: 'final',
      },
    });
  });

  test('race two async iterables and return when the first async iterable returns', async () => {
    const combination = new AsyncIteratorsCombine(
      [
        createAsyncIterable({ i: 6, delay: 50 }),
        createAsyncIterable({ i: 3, delay: 70 }),
      ],
      { lazy: true, method: 'race' }
    );
    expect(await combination.next()).toEqual({
      done: false,
      value: 5,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 2,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 4,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 1,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 3,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 2,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 0,
    });
    expect(await combination.next()).toEqual({
      done: true,
      value: 'final',
    });
  });

  test('any two async iterables and return when the first async iterable returns', async () => {
    const combination = new AsyncIteratorsCombine(
      [
        createAsyncIterable({ i: 6, delay: 50 }),
        createAsyncIterable({ i: 3, delay: 70 }),
      ],
      { lazy: true, method: 'any' }
    );
    expect(await combination.next()).toEqual({
      done: false,
      value: 5,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 2,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 4,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 1,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 3,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 2,
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: 0,
    });
    expect(await combination.next()).toEqual({
      done: true,
      value: 'final',
    });
  });

  test('calling return should call return on all async iterables', async () => {
    const asyncIterable1 = createAsyncIterable({ i: 6, delay: 50 });
    const asyncIterable2 = createAsyncIterable({ i: 3, delay: 70 });
    const returnSpy1 = vi.spyOn(asyncIterable1, 'return');
    const returnSpy2 = vi.spyOn(asyncIterable2, 'return');
    const returnValue = Symbol('returnValue');

    const combination = new AsyncIteratorsCombine([
      asyncIterable1,
      asyncIterable2,
    ]);
    expect(await combination.next()).toEqual({ done: false, value: [5, 2] });
    expect(await combination.return(returnValue)).toEqual({
      done: true,
      value: returnValue,
    });
    expect(returnSpy1).toBeCalledWith(returnValue);
    expect(returnSpy2).toBeCalledWith(returnValue);
  });

  test('calling return should call return on all async iterables passed to returnAsyncIterators', async () => {
    const asyncIterable1 = createAsyncIterable({ i: 6, delay: 50 });
    const asyncIterable2 = createAsyncIterable({ i: 3, delay: 70 });
    const asyncIterable3 = createAsyncIterable({ i: 6, delay: 50 });
    const asyncIterable4 = createAsyncIterable({ i: 3, delay: 70 });
    const returnSpy1 = vi.spyOn(asyncIterable1, 'return');
    const returnSpy2 = vi.spyOn(asyncIterable2, 'return');
    const returnSpy3 = vi.spyOn(asyncIterable3, 'return');
    const returnSpy4 = vi.spyOn(asyncIterable4, 'return');
    const returnValue = Symbol('returnValue');

    const combination = new AsyncIteratorsCombine(
      [asyncIterable1, asyncIterable2, asyncIterable3, asyncIterable4],
      {
        returnAsyncIterators: [asyncIterable2, asyncIterable3],
      }
    );
    expect(await combination.next()).toEqual({
      done: false,
      value: [5, 2, 5, 2],
    });
    expect(await combination.return(returnValue)).toEqual({
      done: true,
      value: returnValue,
    });
    expect(returnSpy1).not.toBeCalled();
    expect(returnSpy2).toBeCalledWith(returnValue);
    expect(returnSpy3).toBeCalledWith(returnValue);
    expect(returnSpy4).not.toBeCalled();
  });

  test('async iterator throws an error all async iterators return', async () => {
    const asyncIterable1 = createAsyncIterable({ i: 7, throwErrorAt: 3 });
    const asyncIterable2 = createAsyncIterable({ i: 4 });
    const returnSpy1 = vi.spyOn(asyncIterable1, 'return');
    const returnSpy2 = vi.spyOn(asyncIterable2, 'return');

    const combination = new AsyncIteratorsCombine([
      asyncIterable1,
      asyncIterable2,
    ]);
    expect(await combination.next()).toEqual({ done: false, value: [6, 3] });
    expect(await combination.next()).toEqual({ done: false, value: [5, 2] });
    expect(await combination.next()).toEqual({ done: false, value: [4, 1] });
    await expect(combination.next()).rejects.toThrow('Error thrown at 3');
    expect(returnSpy1).not.toBeCalled();
    expect(returnSpy2).toBeCalledWith(undefined);
    expect(await combination.next()).toEqual({
      done: true,
      value: undefined,
    });
  });

  test('calling throw should call return on all async iterables', async () => {
    const asyncIterable1 = createAsyncIterable({ i: 6, delay: 50 });
    const asyncIterable2 = createAsyncIterable({ i: 3, delay: 70 });
    const returnSpy1 = vi.spyOn(asyncIterable1, 'return');
    const returnSpy2 = vi.spyOn(asyncIterable2, 'return');

    const combination = new AsyncIteratorsCombine([
      asyncIterable1,
      asyncIterable2,
    ]);
    await expect(
      combination.throw(new Error('Error thrown at 2'))
    ).rejects.toThrow('Error thrown at 2');
    expect(returnSpy1).toBeCalledWith(undefined);
    expect(returnSpy2).toBeCalledWith(undefined);
  });

  test('will return when it was already returned', async () => {
    const returnValue = Symbol('value');
    const combination = new AsyncIteratorsCombine([
      createAsyncIterable({ i: 1 }),
      createAsyncIterable({ i: 1 }),
    ]);
    expect(await combination.return()).toEqual({
      done: true,
      value: undefined,
    });
    expect(await combination.return(returnValue)).toEqual({
      done: true,
      value: returnValue,
    });
  });

  test('combine an empty array and be done immediately', async () => {
    const combination = new AsyncIteratorsCombine([]);
    expect(await combination.next()).toEqual({ done: true, value: [] });
  });
});
