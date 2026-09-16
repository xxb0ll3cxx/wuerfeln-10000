export class GameStore {
  #state;

  #listeners = new Set();

  constructor(initialState) {
    this.#state = initialState;
  }

  getState() {
    return this.#state;
  }

  setState(updater) {
    const nextState =
      typeof updater === 'function'
        ? updater(this.#state)
        : updater;

    this.#state = nextState;

    this.#notify();
  }

  subscribe(listener) {
    this.#listeners.add(listener);

    return () => {
      this.#listeners.delete(listener);
    };
  }

  #notify() {
    for (const listener of this.#listeners) {
      listener(this.#state);
    }
  }
}