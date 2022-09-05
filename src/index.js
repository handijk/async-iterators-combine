import { race } from './race.js';
export { all } from './all.js';
export { race };
export const combineLatest = (iterable, options) =>
  race(iterable, { ...options, combine: true });
