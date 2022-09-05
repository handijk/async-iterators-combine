# async-iterators-combine

Combine async iterators into a Generator object (iterator and iterable).

- [Installation](#installation)
- [Usage](#usage)

## Installation

```
npm i async-iterators-combine
```

## Usage

`all` yields an output value when every async iterator has yielded a value untill all async iterators are done.
To change the default behavior and stop when as soon as the first async iterator is done pass `{ lazy: true }` as the second argument.

```js
import { all } from 'async-iterators-combine';

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

const combination = all([generator1, generator2]);

for await (const output of combination) {
  console.log(output); // -> [1, 'a'], [2, 'b'], [3, 'c'], [3, 'd'], [3, 'e']
}

const combination2 = all([generator1, generator2], { lazy: true });

for await (const output of combination2) {
  console.log(output); // -> [1, 'a'], [2, 'b'], [3, 'c']
}
```

`race` yields an output value when any async iterator yields a value untill all async iterators are done.
To change the default behavior and stop when as soon as the first async iterator is done pass `{ lazy: true }` as the second argument.

```js
import { race } from 'async-iterators-combine';

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

const combination = race([ generator1, generator2 ]);

for await (const output of combination) {
  console.log(output); // -> 'a', 'b', 1, 'c', 2, 3
}

const combination2 = race([ generator1, generator2 ], {
   lazy: true
})

for await (const output of combination2) {
  console.log(output); // -> 'a', 'b', 1, 'c'
}
```

`combineLatest` yields combined values from all async iterators every time on of the async iterators yields.
It will start yielding when all async iterators have yielded at least one value and will stop yielding when all async iterators are done.
To change the default behavior and start yielding as soon as the first async iterator has yielded pass `{ eager: true }` to the options as the second argument, to stop yielding as soon as the first async iterator is done pass `{ lazy: true }` to the options as the second argument.

```js
import { combineLatest } from 'async-iterators-combine';

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

const combination = combineLatest([ generator1, generator2 ]);

for await (const output of combination) {
  console.log(output); // -> [1, 'a'], [1, 'b'], [1, 'c'], [2, 'c'], [3, 'c']
}

const combination2 = combineLatest([ generator1, generator2 ], {
   eager: true,
})

for await (const output of combination2) {
  console.log(output); // -> [undefined, 'a'], [undefined, 'b'], [1, 'c'], [2, 'c'], [3, 'c']
}
```
