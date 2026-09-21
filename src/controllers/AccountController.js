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
    email,
    password,
  }) {
    this.accountStore
      .setLoading(
        true,
      );


    try {
      const result =
        await this.authService
          .signUp(
            email,
            password,
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


  async #loadAccountData() {
    try {
      const {
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
}