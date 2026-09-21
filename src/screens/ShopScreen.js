import {
  SCREENS,
} from '../app/screens.js';

import {
  getCharacterSkinById,
} from '../config/characterSkins.js';

import {
  ShopService,
} from '../services/ShopService.js';

import {
  AccountService,
} from '../services/AccountService.js';

export class ShopScreen {
  constructor({
    navigate,
    accountStore,
  }) {
    this.navigate =
      navigate;

    this.accountStore =
      accountStore;

    this.shopService =
      new ShopService();

    this.accountService =
      new AccountService();


    this.coinElement =
      null;


    this.messageElement =
      null;


    this.isPurchasing =
      false;

    this.backButton =
      null;

    this.catalogElement =
      null;

    this.handleBack =
      null;

    this.isDestroyed =
      false;
  }


  mount(
    rootElement,
  ) {
    this.isDestroyed =
      false;


    const {
      coins,
    } =
      this.accountStore
        .getState();


    rootElement.innerHTML = `
      <main class="screen shop-screen">
        <header class="shop-screen__header">
          <h1></h1>

          <p>
            Coins:
            <strong>
              ${Number(coins ?? 0).toLocaleString('de-DE')}
            </strong>
          </p>
        </header>

        <section
          class="shop-screen__catalog"
          data-shop-catalog
          aria-label="Shop-Produkte"
        >
          <p>Produkte werden geladen ...</p>
        </section>

        <p
          class="shop-screen__message"
          data-shop-message
          role="status"
          aria-live="polite"
        ></p>
        <button
          class="shop-screen__back"
          type="button"
          data-action="back"
        >
          Zurück
        </button>
      </main>
    `;


    this.catalogElement =
      rootElement.querySelector(
        '[data-shop-catalog]',
      );

    this.coinElement =
      rootElement.querySelector(
        '[data-shop-coins]',
      );


    this.messageElement =
      rootElement.querySelector(
        '[data-shop-message]',
      );


    this.backButton =
      rootElement.querySelector(
        '[data-action="back"]',
      );


    this.handleBack =
      () => {
        this.navigate(
          SCREENS.MODE_SELECT,
        );
      };


    this.backButton
      ?.addEventListener(
        'click',
        this.handleBack,
      );


    void this.#loadCatalog();
  }


  async #loadCatalog() {
    try {
      const products =
        await this.shopService
          .loadCharacterSkins();


      if (
        this.isDestroyed ||
        !this.catalogElement
      ) {
        return;
      }


      this.catalogElement
        .replaceChildren();


      if (
        products.length === 0
      ) {
        this.catalogElement
          .textContent =
          'Noch keine Produkte im Shop vorhanden.';

        return;
      }


      const {
        inventory,
      } =
        this.accountStore
          .getState();


      const ownedIds =
        new Set(
          inventory.map(
            (item) =>
              item.cosmetic_id,
          ),
        );


      for (
        const product
        of products
      ) {
        const skin =
          getCharacterSkinById(
            product.id,
          );


        if (
          !skin
        ) {
          continue;
        }


        const card =
          document.createElement(
            'article',
          );

        card.className =
          'shop-screen__product';


        const image =
          document.createElement(
            'img',
          );

        image.className =
          'shop-screen__portrait';

        image.src =
          skin.portrait;

        image.alt =
          skin.name;


        const title =
          document.createElement(
            'h2',
          );

        title.textContent =
          product.name;


        const price =
          document.createElement(
            'p',
          );
        price.className =
          'shop-screen__price';

        price.textContent =
          `${Number(product.price).toLocaleString('de-DE')} Coins`;


        const button =
          document.createElement(
            'button',
          );
        button.className =
          'shop-screen__buy';

        button.type =
          'button';


        const isOwned =
          ownedIds.has(
            product.id,
          );
        button.className =
          isOwned
            ? 'shop-screen__buy shop-screen__buy--owned'
            : 'shop-screen__buy';

        button.disabled =
          isOwned ||
          this.isPurchasing;


        button.textContent =
          isOwned
            ? 'Im Besitz'
            : 'Kaufen';


        if (
          !isOwned
        ) {
          button.addEventListener(
            'click',
            () => {
              void this.#purchase(
                product,
              );
            },
          );
        }


        card.append(
          image,
          title,
          price,
          button,
        );


        this.catalogElement
          .append(
            card,
          );
      }
    }
    catch (
      error
    ) {
      if (
        this.isDestroyed ||
        !this.catalogElement
      ) {
        return;
      }


      console.error(
        'Shop-Katalog konnte nicht geladen werden:',
        error,
      );


      this.catalogElement
        .textContent =
        'Produkte konnten nicht geladen werden. Bitte prüfe die Browser-Konsole.';
    }
  }

  #showMessage(
    message,
  ) {
    if (
      this.isDestroyed ||
      !this.messageElement
    ) {
      return;
    }


    this.messageElement
      .textContent =
      message;
  }
  
    async #purchase(
      product,
    ) {
      /*
      * Keine mehrfachen oder parallelen Käufe
      * über diesen Shop-Screen starten.
      */

      if (
        this.isPurchasing ||
        this.isDestroyed
      ) {
        return;
      }


      /*
      * Vor dem Kauf bestätigen lassen.
      */

      const confirmed =
        window.confirm(
          `Möchtest du "${product.name}" für ${Number(product.price).toLocaleString('de-DE')} Coins kaufen?`,
        );


      if (
        !confirmed
      ) {
        return;
      }


      this.isPurchasing =
        true;


      this.#showMessage(
        'Kauf wird durchgeführt ...',
      );


      /*
      * Während des Kaufs alle Produktbuttons
      * vorübergehend deaktivieren.
      */

      const buttons =
        this.catalogElement
          ?.querySelectorAll(
            '.shop-screen__product button',
          );


      buttons?.forEach(
        (button) => {
          button.disabled =
            true;
        },
      );


      /*
      * SCHRITT 1:
      * Den Kauf in Supabase durchführen.
      */

      let remainingCoins;


      try {
        remainingCoins =
          await this.shopService
            .purchaseCosmetic(
              product.id,
            );
      }
      catch (
        error
      ) {
        console.error(
          'Kauf fehlgeschlagen:',
          error,
        );


        this.#showMessage(
          error.message ??
          'Der Kauf konnte nicht durchgeführt werden.',
        );


        this.isPurchasing =
          false;


        if (
          !this.isDestroyed
        ) {
          void this.#loadCatalog();
        }


        return;
      }


      /*
      * Ab hier hat die Datenbank den Kauf
      * erfolgreich abgeschlossen.
      *
      * Den bestätigten neuen Coinstand übernehmen.
      */

      this.accountStore
        .setCoins(
          remainingCoins,
        );


      /*
      * Den bestätigten Kauf im lokalen
      * AccountStore vormerken.
      *
      * Danach werden die tatsächlichen
      * Daten erneut aus Supabase geladen.
      */

      const currentInventory =
        this.accountStore
          .getState()
          .inventory;


      if (
        !currentInventory.some(
          (item) =>
            item.cosmetic_id ===
            product.id,
        )
      ) {
        this.accountStore
          .setInventory([
            ...currentInventory,

            {
              cosmetic_id:
                product.id,

              acquired_at:
                new Date()
                  .toISOString(),
            },
          ]);
      }


      /*
      * SCHRITT 2:
      * Wallet und Inventory aus Supabase
      * neu laden.
      */

      try {
        const accountData =
          await this.accountService
            .loadAccountData();


        this.accountStore
          .setCoins(
            accountData.coins,
          );


        this.accountStore
          .setInventory(
            accountData.inventory,
          );


        this.accountStore
          .setEquippedCosmetics(
            accountData.equippedCosmetics,
          );


        this.#showMessage(
          `"${product.name}" wurde erfolgreich gekauft!`,
        );
      }
      catch (
        error
      ) {
        console.error(
          'Kauf erfolgreich, aber Datenabgleich fehlgeschlagen:',
          error,
        );


        this.#showMessage(
          'Der Kauf war erfolgreich. Die Accountdaten konnten jedoch nicht vollständig aktualisiert werden. Bitte lade die App neu.',
        );
      }
  finally {
    this.isPurchasing =
      false;


    /*
     * Coinanzeige aktualisieren.
     */

    if (
      !this.isDestroyed &&
      this.coinElement
    ) {
      const {
        coins,
      } =
        this.accountStore
          .getState();


      this.coinElement
        .textContent =
        Number(
          coins ?? 0,
        ).toLocaleString(
          'de-DE',
        );
    }


    /*
     * Produktkarten mit dem aktuellen
     * Besitzstatus neu aufbauen.
     */

    if (
      !this.isDestroyed
    ) {
      void this.#loadCatalog();
    }
  }
}


  destroy() {
    this.isDestroyed =
      true;


    this.backButton
      ?.removeEventListener(
        'click',
        this.handleBack,
      );
    this.coinElement =
      null;

    this.messageElement =
      null;

    this.backButton =
      null;

    this.catalogElement =
      null;

    this.handleBack =
      null;
  }
}