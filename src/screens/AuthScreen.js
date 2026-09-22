import {
  SCREENS,
} from '../app/screens.js';


export class AuthScreen {
  constructor({
    navigate,
    accountController,
  }) {
    this.navigate =
      navigate;

    this.accountController =
      accountController;

    this.form =
      null;

    this.emailInput =
      null;

    this.passwordInput =
      null;

    this.messageElement =
      null;

    this.loginButton =
      null;

    this.registerButton =
      null;

    this.backButton =
      null;

    this.returnTo =
      SCREENS.MODE_SELECT;

    this.handleLogin =
      null;

    this.handleRegister =
      null;

    this.handleBack =
      null;
  }


  mount(
    rootElement,
    params = {},
  ) {
    this.returnTo =
      params.returnTo ??
      SCREENS.MODE_SELECT;


    rootElement.innerHTML = `
  <main class="screen auth-screen">

    <h1 class="auth-screen__headline">
      
    </h1>

    <form
      class="auth-screen__form"
      data-auth-form
    >

      <label
        class="
          auth-screen__field
          auth-screen__field--email
        "
      >
        <span class="auth-screen__label">
          E-Mail
        </span>

        <input
          class="auth-screen__input"
          type="email"
          autocomplete="email"
          data-auth-email
          required
        >
      </label>


      <label
        class="
          auth-screen__field
          auth-screen__field--password
        "
      >
        <span class="auth-screen__label">
          Passwort
        </span>

        <input
          class="auth-screen__input"
          type="password"
          autocomplete="current-password"
          data-auth-password
          required
        >
      </label>


      <p
        class="auth-screen__message"
        data-auth-message
        role="status"
        aria-live="polite"
      ></p>


      <button
        class="
          auth-screen__button
          auth-screen__button--login
        "
        type="button"
        data-action="login"
      >
        
      </button>


      <button
        class="
          auth-screen__button
          auth-screen__button--register
        "
        type="button"
        data-action="register"
      >
      </button>


      <button
        class="
          auth-screen__button
          auth-screen__button--back
        "
        type="button"
        data-action="back"
      >
        
      </button>

    </form>

  </main>
`;


    this.form =
      rootElement.querySelector(
        '[data-auth-form]',
      );

    this.emailInput =
      rootElement.querySelector(
        '[data-auth-email]',
      );

    this.passwordInput =
      rootElement.querySelector(
        '[data-auth-password]',
      );

    this.messageElement =
      rootElement.querySelector(
        '[data-auth-message]',
      );

    this.loginButton =
      rootElement.querySelector(
        '[data-action="login"]',
      );

    this.registerButton =
      rootElement.querySelector(
        '[data-action="register"]',
      );

    this.backButton =
      rootElement.querySelector(
        '[data-action="back"]',
      );


    this.handleLogin =
      async () => {
        await this.#login();
      };


    this.handleRegister =
      async () => {
        await this.#register();
      };


    this.handleBack =
      () => {
        this.navigate(
          SCREENS.MODE_SELECT,
        );
      };


    this.loginButton
      ?.addEventListener(
        'click',
        this.handleLogin,
      );

    this.registerButton
      ?.addEventListener(
        'click',
        this.handleRegister,
      );

    this.backButton
      ?.addEventListener(
        'click',
        this.handleBack,
      );
  }


  async #login() {
    const credentials =
      this.#getCredentials();


    if (!credentials) {
      return;
    }


    this.#setBusy(
      true,
    );


    try {
      await this.accountController
        .login(
          credentials,
        );


      this.navigate(
        this.returnTo,
      );
    }
    catch (error) {
      this.#showMessage(
        error.message ??
        'Login fehlgeschlagen.',
      );
    }
    finally {
      this.#setBusy(
        false,
      );
    }
  }


  async #register() {
    const credentials =
      this.#getCredentials();


    if (!credentials) {
      return;
    }


    this.#setBusy(
      true,
    );


    try {
      const result =
        await this.accountController
          .register(
            credentials,
          );


      if (
        !result.session
      ) {
        this.#showMessage(
          'Account erstellt. Bitte bestätige deine E-Mail.',
        );

        return;
      }


      this.navigate(
        this.returnTo,
      );
    }
    catch (error) {
      this.#showMessage(
        error.message ??
        'Registrierung fehlgeschlagen.',
      );
    }
    finally {
      this.#setBusy(
        false,
      );
    }
  }


  #getCredentials() {
    const email =
      this.emailInput
        ?.value
        .trim();

    const password =
      this.passwordInput
        ?.value ??
      '';


    if (
      !email ||
      !password
    ) {
      this.#showMessage(
        'Bitte E-Mail und Passwort eingeben.',
      );

      return null;
    }


    return {
      email,
      password,
    };
  }


  #setBusy(
    busy,
  ) {
    if (
      this.loginButton
    ) {
      this.loginButton.disabled =
        busy;
    }


    if (
      this.registerButton
    ) {
      this.registerButton.disabled =
        busy;
    }
  }


  #showMessage(
    message,
  ) {
    if (
      this.messageElement
    ) {
      this.messageElement
        .textContent =
        message;
    }
  }


  destroy() {
    this.loginButton
      ?.removeEventListener(
        'click',
        this.handleLogin,
      );

    this.registerButton
      ?.removeEventListener(
        'click',
        this.handleRegister,
      );

    this.backButton
      ?.removeEventListener(
        'click',
        this.handleBack,
      );


    this.form =
      null;

    this.emailInput =
      null;

    this.passwordInput =
      null;

    this.messageElement =
      null;

    this.loginButton =
      null;

    this.registerButton =
      null;

    this.backButton =
      null;
  }
}