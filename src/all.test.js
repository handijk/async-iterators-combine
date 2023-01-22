import { describe, test, expect, jest } from '@jest/globals';
import { all } from './all.js';

describe('all', () => {
  const createTimeoutPromise = (delay) => {
    return new Promise((resolve) => {
      global.setTimeout(resolve, delay);
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

  test('combine two async iterables', async () => {
    const combination = all([
      createAsyncIterable({ i: 6, delay: 50 }),
      createAsyncIterable({ i: 3, delay: 70 }),
    ]);
    expect(await combination.next()).toEqual({ done: false, value: [5, 2] });
    expect(await combination.next()).toEqual({ done: false, value: [4, 1] });
    expect(await combination.next()).toEqual({ done: false, value: [3, 0] });
    expect(await combination.next()).toEqual({ done: false, value: [2, 0] });
    expect(await combination.next()).toEqual({ done: false, value: [1, 0] });
    expect(await combination.next()).toEqual({ done: false, value: [0, 0] });
    expect(await combination.next()).toEqual({
      done: true,
      value: ['final', 'final'],
    });
  });

  test('combine two async iterables and loop them', async () => {
    let i = 0;
    const values = [
      [5, 2],
      [4, 1],
      [3, 0],
      [2, 0],
      [1, 0],
      [0, 0],
    ];
    const combination = all([
      createAsyncIterable({ i: 6, delay: 50 }),
      createAsyncIterable({ i: 3, delay: 70 }),
    ]);
    for await (const value of combination) {
      expect(value).toEqual(values[i]);
      i++;
    }
    expect(i).toEqual(6);
  });

  test('calling return should call return on async iterables', async () => {
    const asyncIterable1 = createAsyncIterable({ i: 6, delay: 50 });
    const asyncIterable2 = createAsyncIterable({ i: 3, delay: 70 });
    const returnSpy1 = jest.spyOn(asyncIterable1, 'return');
    const returnSpy2 = jest.spyOn(asyncIterable2, 'return');

    const combination = all([asyncIterable1, asyncIterable2]);
    expect(await combination.next()).toEqual({ done: false, value: [5, 2] });
    expect(await combination.return()).toEqual({
      done: true,
      value: undefined,
    });
    expect(returnSpy1).toBeCalledWith();
    expect(returnSpy2).toBeCalledWith();
  });

  test('calling throw should call return on all async iterables', async () => {
    const asyncIterable1 = createAsyncIterable({ i: 6, delay: 50 });
    const asyncIterable2 = createAsyncIterable({ i: 3, delay: 70 });
    const returnSpy1 = jest.spyOn(asyncIterable1, 'return');
    const returnSpy2 = jest.spyOn(asyncIterable2, 'return');

    const combination = all([asyncIterable1, asyncIterable2]);
    expect(await combination.next()).toEqual({ done: false, value: [5, 2] });
    await expect(
      combination.throw(new Error('Error thrown at 2'))
    ).rejects.toThrow('Error thrown at 2');
    expect(returnSpy1).toBeCalledWith();
    expect(returnSpy2).toBeCalledWith();
  });

  test('throw an error', async () => {
    const asyncIterable1 = createAsyncIterable({ i: 7, throwErrorAt: 3 });
    const asyncIterable2 = createAsyncIterable({ i: 4 });
    const returnSpy1 = jest.spyOn(asyncIterable1, 'return');
    const returnSpy2 = jest.spyOn(asyncIterable2, 'return');

    const combination = all([asyncIterable1, asyncIterable2]);
    expect(await combination.next()).toEqual({ done: false, value: [6, 3] });
    expect(await combination.next()).toEqual({ done: false, value: [5, 2] });
    expect(await combination.next()).toEqual({ done: false, value: [4, 1] });
    await (async () => {
      await expect(combination.next()).rejects.toThrow('Error thrown at 3');
    })();
    expect(returnSpy1).toBeCalledWith();
    expect(returnSpy2).toBeCalledWith();
    expect(await combination.next()).toEqual({ done: true, value: undefined });
  });

  test('combine two async iterables and stop when the first async iterable returns', async () => {
    const combination = all(
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
      value: [undefined, 'final'],
    });
  });

  test('combine an empty array and be done immediately', async () => {
    const combination = all([]);
    expect(await combination.next()).toEqual({ done: true, value: [] });
  });

  test('will return immediately', async () => {
    const combination = all([createAsyncIterable(0), createAsyncIterable(0)]);
    expect(await combination.next()).toEqual({
      done: true,
      value: ['final', 'final'],
    });
  });
});
