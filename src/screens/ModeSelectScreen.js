import {
  SCREENS,
} from '../app/screens.js';


export class ModeSelectScreen {
  constructor({
    navigate,
    accountStore,
    accountController,
  }) {
    this.navigate =
      navigate;


    this.virtualButton =
      null;

    this.scoreboardButton =
      null;

    this.backButton =
      null;


    this.handleVirtual =
      null;

    this.handleScoreboard =
      null;

    this.handleBack =
      null;
    this.accountStore =
      accountStore;

    this.accountController =
      accountController;

    this.shopButton =
      null;

    this.cosmeticsButton =
      null;

    this.accountButton =
      null;

    this.accountNameElement =
      null;

    this.coinElement =
      null;

    this.unsubscribeAccount =
      null;

    this.handleShop =
      null;

    this.handleCosmetics =
      null;

    this.handleAccount =
      null;
  }


  /*
   * =======================================================
   * MOUNT
   * =======================================================
   */

  mount(
    rootElement,
  ) {
    rootElement.innerHTML = `
      <main
        class="
          screen
          mode-select-screen
        "
      >

        <!--
          ===================================================
          ACCESSIBLE TITLE
          ===================================================

          Die eigentliche visuelle Gestaltung befindet sich
          im Hintergrund / in den Button-Assets.

          Die Überschrift bleibt für Screenreader erhalten.
        -->

        <h1
          class="mode-select__accessible-title"
        >
          Spielmodus auswählen
        </h1>


        <!--
          ===================================================
          VIRTUAL MODE
          ===================================================
        -->

        <div
          class="
            mode-select__button-slot
            mode-select__button-slot--virtual
          "
        >
          <button
            type="button"
            class="
              mode-select__button
              mode-select__button--virtual
            "
            data-action="virtual"
            aria-label="Virtuellen Spielmodus starten"
          ></button>
        </div>


        <!--
          ===================================================
          SCOREBOARD MODE
          ===================================================
        -->

        <div
          class="
            mode-select__button-slot
            mode-select__button-slot--scoreboard
          "
        >
          <button
            type="button"
            class="
              mode-select__button
              mode-select__button--scoreboard
            "
            data-action="scoreboard"
            aria-label="Scoreboard-Spielmodus starten"
          ></button>
        </div>



        <div
          class="
            mode-select__button-slot
            mode-select__button-slot--shop
          "
        >
          <button
            type="button"
            class="
              mode-select__button
              mode-select__button--shop
            "
            data-action="shop"
            aria-label="Shop öffnen"
          >
          
          </button>
        </div>


        <div
          class="
            mode-select__button-slot
            mode-select__button-slot--cosmetics
          "
        >
          <button
            type="button"
            class="
              mode-select__button
              mode-select__button--cosmetics
            "
            data-action="cosmetics"
            aria-label="Kosmetik auswählen"
          >
            
          </button>
        </div>


        <div
          class="mode-select__account"
        >
          <span
            data-account-name
          >
            Nicht eingeloggt
          </span>

          <span class="mode-select__coins">
            Coins:
            <strong
              data-account-coins
            >
              0
            </strong>
          </span>

          <button
            type="button"
            data-action="account"
          >
            
          </button>
        </div>

        <!--
          ===================================================
          BACK
          ===================================================
        -->

        <div
          class="
            mode-select__button-slot
            mode-select__button-slot--back
          "
        >
          <button
            type="button"
            class="
              mode-select__button
              mode-select__button--back
            "
            data-action="back"
            aria-label="Zurück zum Hauptmenü"
          ></button>
        </div>

      </main>
    `;


    /*
     * =====================================================
     * DOM REFERENCES
     * =====================================================
     */

    this.virtualButton =
      rootElement.querySelector(
        '[data-action="virtual"]',
      );


    this.scoreboardButton =
      rootElement.querySelector(
        '[data-action="scoreboard"]',
      );


    this.backButton =
      rootElement.querySelector(
        '[data-action="back"]',
      );


    if (
      !(
        this.virtualButton instanceof
        HTMLButtonElement
      ) ||
      !(
        this.scoreboardButton instanceof
        HTMLButtonElement
      ) ||
      !(
        this.backButton instanceof
        HTMLButtonElement
      )
    ) {
      throw new Error(
        'Die Buttons der Modusauswahl konnten nicht initialisiert werden.',
      );
    }
    this.shopButton =
  rootElement.querySelector(
    '[data-action="shop"]',
  );


    this.cosmeticsButton =
      rootElement.querySelector(
        '[data-action="cosmetics"]',
      );


    this.accountButton =
      rootElement.querySelector(
        '[data-action="account"]',
      );


    this.accountNameElement =
      rootElement.querySelector(
        '[data-account-name]',
      );


    this.coinElement =
      rootElement.querySelector(
        '[data-account-coins]',
      );


    /*
     * =====================================================
     * EVENT HANDLERS
     * =====================================================
     */

    this.handleVirtual =
      () => {
        this.navigate(
          SCREENS.PLAYER_SETUP,
          {
            mode:
              'virtual',
          },
        );
      };


    this.handleScoreboard =
      () => {
        this.navigate(
          SCREENS.PLAYER_SETUP,
          {
            mode:
              'scoreboard',
          },
        );
      };



    this.handleShop =
      () => {
        const {
          isAuthenticated,
        } =
          this.accountStore
            .getState();


        if (
          !isAuthenticated
        ) {
          this.navigate(
            SCREENS.AUTH,
            {
              returnTo:
                SCREENS.SHOP,
            },
          );

          return;
        }


        this.navigate(
          SCREENS.SHOP,
        );
      };


    this.handleCosmetics =
      () => {
        const {
          isAuthenticated,
        } =
          this.accountStore
            .getState();


        if (
          !isAuthenticated
        ) {
          this.navigate(
            SCREENS.AUTH,
            {
              returnTo:
                SCREENS.COSMETICS,
            },
          );

          return;
        }


        this.navigate(
          SCREENS.COSMETICS,
        );
      };


    this.handleAccount =
      async () => {
        const {
          isAuthenticated,
        } =
          this.accountStore
            .getState();


        if (
          !isAuthenticated
        ) {
          this.navigate(
            SCREENS.AUTH,
          );

          return;
        }


        await this.accountController
          .logout();
      };

    this.handleBack =
      () => {
        this.navigate(
          SCREENS.MAIN_MENU,
        );
      };


    const syncAccount =
      (
        state,
      ) => {
        if (
          !this.accountNameElement ||
          !this.coinElement ||
          !this.accountButton
        ) {
          return;
        }


        if (
          state.isLoading
        ) {
          this.accountNameElement
            .textContent =
            'Account wird geladen...';

          return;
        }


        if (
          !state.isAuthenticated
        ) {
          this.accountNameElement
            .textContent =
            'Nicht eingeloggt';

          this.coinElement
            .textContent =
            '0';

          this.accountButton
            .textContent =
            '';
          this.accountButton.dataset.authenticated =
            'false';

          return;
        }


        this.accountNameElement
          .textContent =
          state.user?.email ??
          'Account';


        this.coinElement
          .textContent =
          Number(
            state.coins ?? 0,
          ).toLocaleString(
            'de-DE',
          );


        this.accountButton
          .textContent =
          '';
        this.accountButton.dataset.authenticated =
          'true';
      };


    syncAccount(
      this.accountStore
        .getState(),
    );


    this.unsubscribeAccount =
      this.accountStore
        .subscribe(
          syncAccount,
        );


    /*
     * =====================================================
     * LISTENERS
     * =====================================================
     */
    this.shopButton
      ?.addEventListener(
        'click',
        this.handleShop,
      );


    this.cosmeticsButton
      ?.addEventListener(
        'click',
        this.handleCosmetics,
      );


    this.accountButton
      ?.addEventListener(
        'click',
        this.handleAccount,
      );



    this.virtualButton
      .addEventListener(
        'click',
        this.handleVirtual,
      );


    this.scoreboardButton
      .addEventListener(
        'click',
        this.handleScoreboard,
      );


    this.backButton
      .addEventListener(
        'click',
        this.handleBack,
      );
  }


  /*
   * =======================================================
   * CLEANUP
   * =======================================================
   */

  destroy() {
      this.shopButton
        ?.removeEventListener(
          'click',
          this.handleShop,
        );


      this.cosmeticsButton
        ?.removeEventListener(
          'click',
          this.handleCosmetics,
        );


      this.accountButton
        ?.removeEventListener(
          'click',
          this.handleAccount,
        );


      this.unsubscribeAccount?.();

      this.unsubscribeAccount =
        null;

    this.virtualButton
      ?.removeEventListener(
        'click',
        this.handleVirtual,
      );


    this.scoreboardButton
      ?.removeEventListener(
        'click',
        this.handleScoreboard,
      );


    this.backButton
      ?.removeEventListener(
        'click',
        this.handleBack,
      );


    this.virtualButton =
      null;

    this.scoreboardButton =
      null;

    this.backButton =
      null;


    this.handleVirtual =
      null;

    this.handleScoreboard =
      null;

    this.handleBack =
      null;

    this.shopButton =
      null;

    this.cosmeticsButton =
      null;

    this.accountButton =
      null;

    this.accountNameElement =
      null;

    this.coinElement =
      null;

    this.handleShop =
      null;

    this.handleCosmetics =
      null;

    this.handleAccount =
      null;
  }
}