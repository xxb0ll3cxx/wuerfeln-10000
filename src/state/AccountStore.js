export class AccountStore {
  constructor() {
    this.state = {
      user:
        null,

      isAuthenticated:
        false,

      isLoading:
        true,

      error:
        null,

      /*
       * Kommt später aus Supabase.
       */
      coins:
        0,

      inventory:
        [],

      equippedCosmetics:
        {},
    };


    this.listeners =
      new Set();
  }


  getState() {
    return this.state;
  }


  subscribe(
    listener,
  ) {
    this.listeners.add(
      listener,
    );


    return () => {
      this.listeners.delete(
        listener,
      );
    };
  }


  setUser(
    user,
  ) {
    this.state = {
      ...this.state,

      user,

      isAuthenticated:
        Boolean(
          user,
        ),

      isLoading:
        false,

      error:
        null,
    };


    this.#emit();
  }


  setLoading(
    isLoading,
  ) {
    this.state = {
      ...this.state,

      isLoading,
    };


    this.#emit();
  }


  setError(
    error,
  ) {
    this.state = {
      ...this.state,

      error:
        error ?? null,

      isLoading:
        false,
    };


    this.#emit();
  }


  setCoins(
    coins,
  ) {
    this.state = {
      ...this.state,

      coins,
    };


    this.#emit();
  }


  setInventory(
    inventory,
  ) {
    this.state = {
      ...this.state,

      inventory:
        Array.isArray(
          inventory,
        )
          ? inventory
          : [],
    };


    this.#emit();
  }


  setEquippedCosmetics(
    equippedCosmetics,
  ) {
    this.state = {
      ...this.state,

      equippedCosmetics:
        equippedCosmetics ??
        {},
    };


    this.#emit();
  }


  reset() {
    this.state = {
      user:
        null,

      isAuthenticated:
        false,

      isLoading:
        false,

      error:
        null,

      coins:
        0,

      inventory:
        [],

      equippedCosmetics:
        {},
    };


    this.#emit();
  }


  #emit() {
    for (
      const listener
      of this.listeners
    ) {
      listener(
        this.state,
      );
    }
  }
}