# async-iterators-combine

Combine async iterators into an object that conforms to the[async iterable and async iterator protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols).

- [Installation](#installation)
- [AsyncIteratorsCombine](#asynciteratorscombine)
- [CombineLatest](#combinelatest)
- [Examples](#examples)

## Installation

```
npm i async-iterators-combine
```

## AsyncIteratorsCombine

Yields an array (`method`: `all` or `allSettled`) or a single value (`method`: `race` or `any`) when the passed [promise concurrency method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#promise_concurrency) returns a value.
Return when the first async iterator returns (`lazy`: `true`) or return when the last async iterator returns (`lazy`: `false`)

```js
new AsyncIteratorsCombine(
  iterable,
  {
    returnAsyncIterators = Array.from(iterable),
    method = 'all',
    lazy = false,
    initialValue = undefined,
  } = {}
)
```

- `iterable` (required): `AsyncIterator[]` 
  - An iterable that consists of items that conform to the [async iterator protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols)
- `options` (optional): an object that has the following optional properties: 
  - `method`: `'all'`, `'allSettled'`, `'race'`, `'any'` (default: `all`)`
    - This is the [promise concurrency method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#promise_concurrency) that is used for combining the yielded values.
  - `lazy`: `true`, `false` (default: `false`)
    - Return when the the first async iterator returns or return when the last async iterator returns.
  - `initialValue`: `any` (default: `undefined`)
    - The initial value for an async iterator that has not yet yielded.
  - `returnAsyncIterators`: `AsyncIterator[]`(default: all async iterators that are passed into `iterable`)
    - All async iterators that are passed into `returnAsyncIterators` are returned when the combined async iterator is returned.

## CombineLatest

Yields an array of all latest yielded values for every async iterator.
Start when the first async iterator yields (`eager`: `true`) or start when all async iterators have yielded (`eager`: `false`).

```js
new CombineLatest(
  iterable,
  {
    returnAsyncIterators = Array.from(iterable),
    eager = false,
    lazy = false,
    initialValue = undefined,
  } = {}
)
```

## Examples

```js
import { AsyncIteratorsCombine } from 'async-iterators-combine';

async function* generator1() {
  yield 1;
  yield 2;
  yield 3;
}

async function* generator2() {
  yield 'a';
  yield 'b';
  yield 'c';
  yield 'd';
  yield 'e';
}

const combination = new AsyncIteratorsCombine([generator1, generator2]);

for await (const output of combination) {
  console.log(output); // -> [1, 'a'], [2, 'b'], [3, 'c'], [3, 'd'], [3, 'e']
}

const combination2 = new AsyncIteratorsCombine([generator1, generator2], { lazy: true });

for await (const output of combination2) {
  console.log(output); // -> [1, 'a'], [2, 'b'], [3, 'c']
}
```

```js
import { AsyncIteratorsCombine } from 'async-iterators-combine';

async function* generator1() {
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });
  yield 1;
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });
  yield 2;
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });
  yield 3;
}

async function* generator2() {
  await new Promise((resolve) => {
    setTimeout(resolve, 50);
  });
  yield 'a';
  await new Promise((resolve) => {
    setTimeout(resolve, 20);
  });
  yield 'b';
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });
  yield 'c';
}

const combination = new AsyncIteratorsCombine([generator1, generator2], { method: 'race' });

for await (const output of combination) {
  console.log(output); // -> 'a', 'b', 1, 'c', 2, 3
}

const combination2 = new AsyncIteratorsCombine([generator1, generator2], {
  method: 'race',
  lazy: true,
});

for await (const output of combination2) {
  console.log(output); // -> 'a', 'b', 1, 'c'
}
```

```js
import { CombineLatest } from 'async-iterators-combine';

async function* generator1() {
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });
  yield 1;
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });
  yield 2;
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });
  yield 3;
}

async function* generator2() {
  await new Promise((resolve) => {
    setTimeout(resolve, 50);
  });
  yield 'a';
  await new Promise((resolve) => {
    setTimeout(resolve, 20);
  });
  yield 'b';
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });
  yield 'c';
}

const combination = new CombineLatest([generator1, generator2]);

for await (const output of combination) {
  console.log(output); // -> [1, 'a'], [1, 'b'], [1, 'c'], [2, 'c'], [3, 'c']
}

const combination2 = new CombineLatest([generator1, generator2], {
  eager: true,
});

for await (const output of combination2) {
  console.log(output); // -> [undefined, 'a'], [undefined, 'b'], [1, 'c'], [2, 'c'], [3, 'c']
}
```
