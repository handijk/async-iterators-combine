import { AsyncIteratorsCombine } from './async-iterators-combine.js';

export class CombineLatest extends AsyncIteratorsCombine {
  constructor(iterable, { eager = false, ...options } = {}) {
    super(iterable, {
      ...options,
      method: eager ? 'race' : 'all',
    });
  }

  async next(...args) {
    const { done, value } = await super.next(...args);
    if (this.method === 'all') {
      this.method = 'race';
    }
    return { done, value: done ? value : this.values };
  }
}
