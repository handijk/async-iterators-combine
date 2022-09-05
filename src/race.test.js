import { describe, test, expect, jest } from '@jest/globals';
import { race } from './race.js';

describe('race', () => {
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

  test('race two async iterables', async () => {
    const combination = race([
      createAsyncIterable({ i: 6, delay: 50 }),
      createAsyncIterable({ i: 3, delay: 70 }),
    ]);
    expect(await combination.next()).toEqual({ done: false, value: 5 });
    expect(await combination.next()).toEqual({ done: false, value: 2 });
    expect(await combination.next()).toEqual({ done: false, value: 4 });
    expect(await combination.next()).toEqual({ done: false, value: 1 });
    expect(await combination.next()).toEqual({ done: false, value: 3 });
    expect(await combination.next()).toEqual({ done: false, value: 2 });
    expect(await combination.next()).toEqual({ done: false, value: 0 });
    expect(await combination.next()).toEqual({ done: false, value: 1 });
    expect(await combination.next()).toEqual({ done: false, value: 0 });
    expect(await combination.next()).toEqual({
      done: true,
      value: 'final',
    });
  });

  test('race two async iterables and loop them', async () => {
    let i = 0;
    const values = [5, 2, 4, 1, 3, 2, 0, 1, 0];
    const combination = race([
      createAsyncIterable({ i: 6, delay: 50 }),
      createAsyncIterable({ i: 3, delay: 70 }),
    ]);
    for await (const value of combination) {
      expect(value).toEqual(values[i]);
      i++;
    }
    expect(i).toEqual(9);
  });

  test('calling return should call return on async iterables', async () => {
    const asyncIterable1 = createAsyncIterable({ i: 6, delay: 50 });
    const asyncIterable2 = createAsyncIterable({ i: 3, delay: 70 });
    const returnSpy1 = jest.spyOn(asyncIterable1, 'return');
    const returnSpy2 = jest.spyOn(asyncIterable2, 'return');

    const combination = race([asyncIterable1, asyncIterable2]);
    expect(await combination.next()).toEqual({ done: false, value: 5 });
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

    const combination = race([asyncIterable1, asyncIterable2]);
    expect(await combination.next()).toEqual({ done: false, value: 5 });
    expect(combination.throw(new Error('Error thrown at 2'))).rejects.toThrow(
      'Error thrown at 2'
    );
    expect(returnSpy1).toBeCalledWith();
    expect(returnSpy2).toBeCalledWith();
  });

  test('throw an error', async () => {
    const asyncIterable1 = createAsyncIterable({ i: 6, throwErrorAt: 2 });
    const asyncIterable2 = createAsyncIterable({ i: 3 });
    const returnSpy1 = jest.spyOn(asyncIterable1, 'return');
    const returnSpy2 = jest.spyOn(asyncIterable2, 'return');

    const combination = race([asyncIterable1, asyncIterable2]);
    expect(await combination.next()).toEqual({ done: false, value: 5 });
    expect(await combination.next()).toEqual({ done: false, value: 2 });
    expect(await combination.next()).toEqual({ done: false, value: 4 });
    expect(await combination.next()).toEqual({ done: false, value: 1 });
    expect(await combination.next()).toEqual({ done: false, value: 3 });
    expect(await combination.next()).toEqual({ done: false, value: 0 });
    await (async () => {
      await expect(combination.next()).rejects.toThrow('Error thrown at 2');
    })();
    expect(returnSpy1).toBeCalledWith();
    expect(returnSpy2).toBeCalledWith();
    expect(await combination.next()).toEqual({ done: true, value: undefined });
  });

  test('race two async iterables and wait untill all async iterables have yielded once', async () => {
    const combination = race(
      [
        createAsyncIterable({ i: 6, delay: 50 }),
        createAsyncIterable({ i: 3, delay: 70 }),
      ],
      { eager: false, combine: true }
    );
    expect(await combination.next()).toEqual({ done: false, value: [5, 2] });
    expect(await combination.next()).toEqual({ done: false, value: [4, 2] });
    expect(await combination.next()).toEqual({ done: false, value: [4, 1] });
    expect(await combination.next()).toEqual({ done: false, value: [3, 1] });
    expect(await combination.next()).toEqual({ done: false, value: [2, 1] });
    expect(await combination.next()).toEqual({ done: false, value: [2, 0] });
    expect(await combination.next()).toEqual({ done: false, value: [1, 0] });
    expect(await combination.next()).toEqual({ done: false, value: [0, 0] });
    expect(await combination.next()).toEqual({
      done: true,
      value: ['final', 'final'],
    });
  });

  test('race two async iterables and return when the first async iterable returns', async () => {
    const combination = race(
      [
        createAsyncIterable({ i: 6, delay: 50 }),
        createAsyncIterable({ i: 3, delay: 70 }),
      ],
      { lazy: true }
    );
    expect(await combination.next()).toEqual({ done: false, value: 5 });
    expect(await combination.next()).toEqual({ done: false, value: 2 });
    expect(await combination.next()).toEqual({ done: false, value: 4 });
    expect(await combination.next()).toEqual({ done: false, value: 1 });
    expect(await combination.next()).toEqual({ done: false, value: 3 });
    expect(await combination.next()).toEqual({ done: false, value: 2 });
    expect(await combination.next()).toEqual({ done: false, value: 0 });
    expect(await combination.next()).toEqual({
      done: true,
      value: 'final',
    });
  });

  test('race two async iterables and combine the output', async () => {
    const combination = race(
      [
        createAsyncIterable({ i: 6, delay: 50 }),
        createAsyncIterable({ i: 3, delay: 70 }),
      ],
      { combine: true }
    );
    expect(await combination.next()).toEqual({ done: false, value: [5, 2] });
    expect(await combination.next()).toEqual({ done: false, value: [4, 2] });
    expect(await combination.next()).toEqual({ done: false, value: [4, 1] });
    expect(await combination.next()).toEqual({ done: false, value: [3, 1] });
    expect(await combination.next()).toEqual({ done: false, value: [2, 1] });
    expect(await combination.next()).toEqual({ done: false, value: [2, 0] });
    expect(await combination.next()).toEqual({ done: false, value: [1, 0] });
    expect(await combination.next()).toEqual({ done: false, value: [0, 0] });
    expect(await combination.next()).toEqual({
      done: true,
      value: ['final', 'final'],
    });
  });

  test('race two async iterables, combine the output and start as soon as the first async iterator yields', async () => {
    const combination = race(
      [
        createAsyncIterable({ i: 6, delay: 50 }),
        createAsyncIterable({ i: 3, delay: 70 }),
      ],
      { combine: true, eager: true }
    );
    expect(await combination.next()).toEqual({
      done: false,
      value: [5, undefined],
    });
    expect(await combination.next()).toEqual({ done: false, value: [5, 2] });
    expect(await combination.next()).toEqual({ done: false, value: [4, 2] });
    expect(await combination.next()).toEqual({ done: false, value: [4, 1] });
    expect(await combination.next()).toEqual({ done: false, value: [3, 1] });
    expect(await combination.next()).toEqual({ done: false, value: [2, 1] });
    expect(await combination.next()).toEqual({ done: false, value: [2, 0] });
    expect(await combination.next()).toEqual({ done: false, value: [1, 0] });
    expect(await combination.next()).toEqual({ done: false, value: [0, 0] });
    expect(await combination.next()).toEqual({
      done: true,
      value: ['final', 'final'],
    });
  });

  test('race two async iterables, combine the output and return when the first iterable returns', async () => {
    const combination = race(
      [
        createAsyncIterable({ i: 6, delay: 50 }),
        createAsyncIterable({ i: 3, delay: 70 }),
      ],
      { combine: true, lazy: true }
    );
    expect(await combination.next()).toEqual({ done: false, value: [5, 2] });
    expect(await combination.next()).toEqual({ done: false, value: [4, 2] });
    expect(await combination.next()).toEqual({ done: false, value: [4, 1] });
    expect(await combination.next()).toEqual({ done: false, value: [3, 1] });
    expect(await combination.next()).toEqual({ done: false, value: [2, 1] });
    expect(await combination.next()).toEqual({ done: false, value: [2, 0] });
    expect(await combination.next()).toEqual({
      done: true,
      value: [undefined, 'final'],
    });
  });

  test('combine an empty array and be done immediately', async () => {
    const combination = race([]);
    expect(await combination.next()).toEqual({ done: true, value: undefined });
  });

  test('will return immediately', async () => {
    const combination = race([
      createAsyncIterable({ i: 0 }),
      createAsyncIterable({ i: 0 }),
    ]);
    expect(await combination.next()).toEqual({ done: true, value: 'final' });
  });
});
