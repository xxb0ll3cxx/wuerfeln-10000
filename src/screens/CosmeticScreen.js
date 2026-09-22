import {
  SCREENS,
} from '../app/screens.js';

import {
  getCharacterSkinById,
} from '../config/characterSkins.js';

import {
  CosmeticsService,
} from '../services/CosmeticsService.js';


export class CosmeticsScreen {
  constructor({
    navigate,
    accountStore,
  }) {
    this.navigate =
      navigate;

    this.accountStore =
      accountStore;

    this.cosmeticsService =
      new CosmeticsService();

    this.backButton =
      null;

    this.inventoryElement =
      null;

    this.countElement =
      null;

    this.messageElement =
      null;

    this.handleBack =
      null;

    this.unsubscribeAccount =
      null;

    this.isBusy =
      false;

    this.isDestroyed =
      false;
  }


  mount(
    rootElement,
  ) {
    this.isDestroyed =
      false;


    rootElement.innerHTML = `
      <main
        class="
          screen
          cosmetics-screen
        "
      >
        <header
          class="cosmetics-screen__header"
        >
          <h1>
            
          </h1>

          <p>
            Freigeschaltete Cosmetics:
            <strong
              data-cosmetics-count
            >
              0
            </strong>
          </p>
        </header>


        <section
          class="cosmetics-screen__inventory"
          data-cosmetics-inventory
          aria-label="Deine freigeschalteten Cosmetics"
        ></section>


        <p
          class="cosmetics-screen__message"
          data-cosmetics-message
          role="status"
          aria-live="polite"
        ></p>


        <button
          class="cosmetics-screen__back"
          type="button"
          data-action="back"
        >
          
        </button>
      </main>
    `;


    this.backButton =
      rootElement.querySelector(
        '[data-action="back"]',
      );


    this.inventoryElement =
      rootElement.querySelector(
        '[data-cosmetics-inventory]',
      );


    this.countElement =
      rootElement.querySelector(
        '[data-cosmetics-count]',
      );


    this.messageElement =
      rootElement.querySelector(
        '[data-cosmetics-message]',
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


    /*
     * Darstellung aktualisieren, wenn sich
     * Accountdaten im Hintergrund ändern.
     */

    this.unsubscribeAccount =
      this.accountStore.subscribe(
        () => {
          this.#renderInventory();
        },
      );


    this.#renderInventory();
  }


  /*
   * =========================================================
   * INVENTORY ANZEIGEN
   * =========================================================
   */

  #renderInventory() {
    if (
      this.isDestroyed ||
      !this.inventoryElement
    ) {
      return;
    }


    const {
      inventory,
      equippedCosmetics,
    } =
      this.accountStore
        .getState();


    this.countElement.textContent =
      String(
        inventory.length,
      );


    this.inventoryElement
      .replaceChildren();


    /*
     * Noch keine Cosmetics vorhanden.
     */

    if (
      inventory.length === 0
    ) {
      const emptyMessage =
        document.createElement(
          'p',
        );


      emptyMessage.textContent =
        'Du besitzt noch keine Cosmetics. Besuche den Shop!';


      this.inventoryElement
        .append(
          emptyMessage,
        );


      return;
    }


    /*
     * Alle freigeschalteten Cosmetics
     * durchgehen.
     */

    for (
      const item
      of inventory
    ) {
      const skin =
        getCharacterSkinById(
          item.cosmetic_id,
        );


      /*
       * Wir zeigen momentan Character-Skins.
       * Andere Cosmetic-Typen kommen später hinzu.
       */

      if (
        !skin
      ) {
        continue;
      }


      /*
       * Der Ausrüstungsslot gehört zum
       * jeweiligen Charakter.
       */

      const slotKey =
        `character:${skin.characterId}`;


      const isEquipped =
        equippedCosmetics?.[slotKey] ===
        skin.id;


      /*
       * Produktkarte erstellen.
       */

      const card =
        document.createElement(
          'article',
        );


      card.className =
        'cosmetics-screen__item';


      /*
       * Portrait.
       */

      const image =
        document.createElement(
          'img',
        );


      image.className =
        'cosmetics-screen__portrait';


      image.src =
        skin.portrait;


      image.alt =
        skin.name;


      /*
       * Skinname.
       */

      const title =
        document.createElement(
          'h2',
        );


      title.textContent =
        skin.name;


      /*
       * Besitzstatus.
       */

      const ownership =
        document.createElement(
          'p',
        );


      ownership.textContent =
        '';


      /*
       * Ausrüstungsbutton.
       */

      const button =
        document.createElement(
          'button',
        );


      button.type =
        'button';

      button.className =
        isEquipped
          ? 'cosmetics-screen__equip cosmetics-screen__equip--equipped'
          : 'cosmetics-screen__equip';

      button.disabled =
        this.isBusy;

      button.textContent =
        isEquipped
          ? ''
          : '';


      button.addEventListener(
        'click',
        () => {
          if (isEquipped) {
            void this.#unequipSkin(
              skin,
            );
          } else {
            void this.#equipSkin(
              skin,
            );
          }
        },
      );


      card.append(
        image,
        title,
        ownership,
        button,
      );


      this.inventoryElement
        .append(
          card,
        );
    }


    /*
     * Falls Inventory-Gegenstände vorhanden sind,
     * deren Darstellung wir noch nicht unterstützen.
     */

    if (
      this.inventoryElement
        .children.length === 0
    ) {
      const message =
        document.createElement(
          'p',
        );


      message.textContent =
        'Für deine freigeschalteten Cosmetics ist noch keine Darstellung verfügbar.';


      this.inventoryElement
        .append(
          message,
        );
    }
  }


  /*
   * =========================================================
   * SKIN AUSRÜSTEN
   * =========================================================
   */

  async #equipSkin(
    skin,
  ) {
    if (
      this.isBusy ||
      this.isDestroyed
    ) {
      return;
    }


    const accountState =
      this.accountStore
        .getState();


    /*
     * Clientseitige Vorprüfung.
     * Die verbindliche Besitzprüfung erfolgt
     * zusätzlich in Supabase.
     */

    if (
      !accountState.isAuthenticated ||
      !accountState.inventory.some(
        (item) =>
          item.cosmetic_id ===
          skin.id,
      )
    ) {
      this.#showMessage(
        'Dieser Skin ist für deinen Account nicht verfügbar.',
      );

      return;
    }


    const accountId =
      accountState.user?.id;


    this.isBusy =
      true;


    this.#showMessage(
      'Skin wird ausgerüstet ...',
    );


    this.#renderInventory();


    try {
      /*
       * Ausrüstung in Supabase speichern.
       */

      await this.cosmeticsService
        .equipCharacterSkin(
          skin.id,
        );


      /*
       * Falls der Nutzer inzwischen ausgeloggt
       * oder der Account gewechselt wurde,
       * keinen fremden Zustand überschreiben.
       */

      const currentState =
        this.accountStore
          .getState();


      if (
        !currentState.isAuthenticated ||
        currentState.user?.id !==
          accountId
      ) {
        return;
      }


      /*
       * Die Datenbank hat die Ausrüstung bestätigt.
       * Jetzt den lokalen AccountStore aktualisieren.
       */

      const slotKey =
        `character:${skin.characterId}`;


      this.accountStore
        .setEquippedCosmetics({
          ...currentState.equippedCosmetics,

          [slotKey]:
            skin.id,
        });


      this.#showMessage(
        `"${skin.name}" wurde ausgerüstet.`,
      );
    }
    catch (
      error
    ) {
      console.error(
        'Skin konnte nicht ausgerüstet werden:',
        error,
      );


      this.#showMessage(
        error.message ??
        'Der Skin konnte nicht ausgerüstet werden.',
      );
    }
    finally {
      this.isBusy =
        false;


      this.#renderInventory();
    }
  }

  /*
 * =========================================================
 * SKIN ABLEGEN
 * =========================================================
 */

async #unequipSkin(
  skin,
) {
  if (
    this.isBusy ||
    this.isDestroyed
  ) {
    return;
  }

  const accountState =
    this.accountStore.getState();

  const accountId =
    accountState.user?.id;

  const slotKey =
    `character:${skin.characterId}`;

  /*
   * Nur den aktuell ausgerüsteten Skin
   * des angemeldeten Accounts ablegen.
   */

  if (
    !accountState.isAuthenticated ||
    !accountId ||
    accountState.equippedCosmetics?.[slotKey] !==
      skin.id
  ) {
    this.#showMessage(
      'Dieser Skin ist nicht ausgerüstet.',
    );

    return;
  }

  this.isBusy =
    true;

  this.#showMessage(
    'Skin wird abgelegt ...',
  );

  this.#renderInventory();

  try {
    /*
     * Zuerst die Ausrüstung in
     * Supabase entfernen.
     */

    await this.cosmeticsService
      .unequipCharacterSkin(
        skin.id,
        slotKey,
      );

    /*
     * Prüfen, ob noch derselbe
     * Account angemeldet ist.
     */

    const currentState =
      this.accountStore.getState();

    if (
      !currentState.isAuthenticated ||
      currentState.user?.id !==
        accountId
    ) {
      return;
    }

    /*
     * Nur diesen einen Ausrüstungsslot
     * aus dem lokalen Zustand entfernen.
     */

    const updatedEquipment = {
      ...currentState.equippedCosmetics,
    };

    delete updatedEquipment[slotKey];

    this.accountStore
      .setEquippedCosmetics(
        updatedEquipment,
      );

    this.#showMessage(
      `"${skin.name}" wurde abgelegt. Der Standard-Skin ist wieder aktiv.`,
    );
  }
  catch (
    error
  ) {
    console.error(
      'Skin konnte nicht abgelegt werden:',
      error,
    );

    this.#showMessage(
      error.message ??
      'Der Skin konnte nicht abgelegt werden.',
    );
  }
  finally {
    this.isBusy =
      false;

    this.#renderInventory();
  }
}


  /*
   * =========================================================
   * STATUSMELDUNG
   * =========================================================
   */

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


  /*
   * =========================================================
   * CLEANUP
   * =========================================================
   */

  destroy() {
    this.isDestroyed =
      true;


    this.backButton
      ?.removeEventListener(
        'click',
        this.handleBack,
      );


    this.unsubscribeAccount?.();


    this.unsubscribeAccount =
      null;


    this.backButton =
      null;


    this.inventoryElement =
      null;


    this.countElement =
      null;


    this.messageElement =
      null;


    this.handleBack =
      null;
  }
}