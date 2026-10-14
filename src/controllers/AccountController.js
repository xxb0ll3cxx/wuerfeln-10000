export class AccountController {
  constructor({
    authService,
    accountService,
    accountStore,
  }) {
    if (!authService) {
      throw new Error(
        'AuthService fehlt.',
      );
    }


    if (!accountService) {
      throw new Error(
        'AccountService fehlt.',
      );
    }


    if (!accountStore) {
      throw new Error(
        'AccountStore fehlt.',
      );
    }


    this.authService =
      authService;

    this.accountService =
      accountService;

    this.accountStore =
      accountStore;

    this.unsubscribeAuth =
      null;
  }


  async initialize() {
    this.accountStore
      .setLoading(
        true,
      );


    try {
      const user =
        await this.authService
          .getCurrentUser();


      this.accountStore
        .setUser(
          user,
        );


      if (user) {
        await this
          .#loadAccountData();
      }
    }
    catch (error) {
      console.error(
        'Account konnte nicht geladen werden:',
        error,
      );


      this.accountStore
        .setError(
          error.message,
        );
    }


    this.unsubscribeAuth =
      this.authService
        .onAuthStateChange(
          ({
            user,
          }) => {
            if (!user) {
              this.accountStore
                .reset();

              return;
            }


            this.accountStore
              .setUser(
                user,
              );


            void this
              .#loadAccountData();
          },
        );
  }


  async register({
    username,
    email,
    password,
  }) {
    this.accountStore
      .setLoading(
        true,
      );


    try {
      const normalizedUsername =
        this.#validateUsername(
          username,
        );
      const result =
        await this.authService
          .signUp(
            email,
            password,
            normalizedUsername,
          );


      this.accountStore
        .setUser(
          result.user,
        );


      if (
        result.user &&
        result.session
      ) {
        await this
          .#loadAccountData();
      }


      return result;
    }
    catch (error) {
      this.accountStore
        .setError(
          error.message,
        );


      throw error;
    }
  }


  async login({
    email,
    password,
    username,
  }) {
    this.accountStore
      .setLoading(
        true,
      );


    try {
      const result =
        await this.authService
          .signIn(
            email,
            password,
          );


      this.accountStore
        .setUser(
          result.user,
        );


      if (result.user) {
        await this
          .#loadAccountData();
      }
      if (
        result.user &&
        !this.accountStore
          .getState()
          .username
      ) {
        if (
          !username?.trim()
        ) {
          await this.authService
            .signOut();


          this.accountStore
            .reset();


          throw new Error(
            'Für diesen bestehenden Account muss zuerst ein Nutzername vergeben werden.',
          );
        }


        try {
          await this.setUsername(
            username,
          );
        }
        catch (error) {
          await this.authService
            .signOut();


          this.accountStore
            .reset();


          throw error;
        }
      }

      return result;
    }
    catch (error) {
      this.accountStore
        .setError(
          error.message,
        );


      throw error;
    }
  }


  async logout() {
    try {
      await this.authService
        .signOut();


      this.accountStore
        .reset();
    }
    catch (error) {
      this.accountStore
        .setError(
          error.message,
        );


      throw error;
    }
  }


  async refreshAccountData() {
    const {
      user,
    } =
      this.accountStore
        .getState();


    if (!user) {
      return;
    }


    await this
      .#loadAccountData();
  }
  async setUsername(
    username,
  ) {
    const normalizedUsername =
      this.#validateUsername(
        username,
      );


    const savedUsername =
      await this.accountService
        .updateUsername(
          normalizedUsername,
        );


    this.accountStore
      .setUsername(
        savedUsername,
      );


    return savedUsername;
  }

  async #loadAccountData() {
    try {
      const {
        username,
        coins,
        inventory,
        equippedCosmetics,
      } =
        await this.accountService
          .loadAccountData();


      this.accountStore
        .setCoins(
          coins,
        );


      this.accountStore
        .setInventory(
          inventory,
        );

      this.accountStore
        .setUsername(
          username,
        );

      this.accountStore
        .setEquippedCosmetics(
          equippedCosmetics,
        );
    }
    catch (error) {
      console.error(
        'Accountdaten konnten nicht geladen werden:',
        error,
      );


      this.accountStore
        .setError(
          error.message,
        );
    }
  }


  destroy() {
    this.unsubscribeAuth?.();

    this.unsubscribeAuth =
      null;
  }

#validateUsername(
  username,
) {
  const normalized =
    typeof username ===
      'string'
      ? username.trim()
      : '';


  if (
    normalized.length < 3 ||
    normalized.length > 20
  ) {
    throw new Error(
      'Der Nutzername muss zwischen 3 und 20 Zeichen lang sein.',
    );
  }


  if (
    !/^[A-Za-z0-9_-]+$/
      .test(
        normalized,
      )
  ) {
    throw new Error(
      'Der Nutzername darf nur Buchstaben, Zahlen, _ und - enthalten.',
    );
  }


  return normalized;
}
}