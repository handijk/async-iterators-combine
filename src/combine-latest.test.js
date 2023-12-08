import { describe, test, expect } from 'vitest';
import { CombineLatest } from './combine-latest.js';

describe('combine-latest', () => {
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

  test('race two async iterables and wait untill all async iterables have yielded once', async () => {
    const combination = new CombineLatest([
      createAsyncIterable({ i: 6, delay: 50 }),
      createAsyncIterable({ i: 3, delay: 70 }),
    ]);
    expect(await combination.next()).toEqual({ done: false, value: [5, 2] });
    expect(await combination.next()).toEqual({ done: false, value: [4, 2] });
    expect(await combination.next()).toEqual({ done: false, value: [4, 1] });
    expect(await combination.next()).toEqual({ done: false, value: [3, 1] });
    expect(await combination.next()).toEqual({ done: false, value: [3, 0] });
    expect(await combination.next()).toEqual({ done: false, value: [2, 0] });
    expect(await combination.next()).toEqual({ done: false, value: [1, 0] });
    expect(await combination.next()).toEqual({ done: false, value: [0, 0] });
    expect(await combination.next()).toEqual({
      done: true,
      value: ['final', 'final'],
    });
  });

  test('race two async iterables eagerly and start when to first async iterable has yielded', async () => {
    const combination = new CombineLatest(
      [
        createAsyncIterable({ i: 6, delay: 50 }),
        createAsyncIterable({ i: 3, delay: 70 }),
      ],
      { eager: true }
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

  test('race two async iterables eagerly in a for await loop and start when to first async iterable has yielded', async () => {
    const combination = new CombineLatest(
      [
        createAsyncIterable({ i: 6, delay: 50 }),
        createAsyncIterable({ i: 3, delay: 70 }),
      ],
      { eager: true }
    );
    const values = [
      [5, undefined],
      [5, 2],
      [4, 2],
      [4, 1],
      [3, 1],
      [2, 1],
      [2, 0],
      [1, 0],
      [0, 0],
    ];
    let i = 0;
    for await (const value of combination) {
      expect(value).toStrictEqual(values[i]);
      i++;
    }
  });

  test('race three synchronous async iterables eagerly and start when the first async iterable has yielded', async () => {
    const combination = new CombineLatest(
      [
        createAsyncIterable({ i: 4 }),
        createAsyncIterable({ i: 4 }),
        createAsyncIterable({ i: 4 }),
      ],
      { eager: true }
    );
    expect(await combination.next()).toEqual({
      done: false,
      value: [3, undefined, undefined],
    });
    expect(await combination.next()).toEqual({
      done: false,
      value: [3, 3, undefined],
    });
    expect(await combination.next()).toEqual({ done: false, value: [3, 3, 3] });
    expect(await combination.next()).toEqual({ done: false, value: [2, 3, 3] });
    expect(await combination.next()).toEqual({ done: false, value: [2, 2, 3] });
    expect(await combination.next()).toEqual({ done: false, value: [2, 2, 2] });
    expect(await combination.next()).toEqual({ done: false, value: [1, 2, 2] });
    expect(await combination.next()).toEqual({ done: false, value: [1, 1, 2] });
    expect(await combination.next()).toEqual({ done: false, value: [1, 1, 1] });
    expect(await combination.next()).toEqual({ done: false, value: [0, 1, 1] });
    expect(await combination.next()).toEqual({ done: false, value: [0, 0, 1] });
    expect(await combination.next()).toEqual({ done: false, value: [0, 0, 0] });
    expect(await combination.next()).toEqual({
      done: true,
      value: ['final', 'final', 'final'],
    });
  });

  test('combine an empty array and be done immediately', async () => {
    const combination = new CombineLatest([]);
    expect(await combination.next()).toEqual({ done: true, value: [] });
  });
});
