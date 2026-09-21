import {
  SCREENS,
} from '../app/screens.js';

import {
  CHARACTERS,
} from '../config/characters.js';

import {
  getCharacterSkinById,
} from '../config/characterSkins.js';

import {
  resolveCharacterAppearance,
} from '../config/resolveCharacterAppearance.js';

export class PlayerSetupScreen {
  constructor({
    navigate,
    playerSetupController,
    gameSessionController,
    accountStore,
  }) {
    this.navigate =
      navigate;

    this.playerSetupController =
      playerSetupController;

    this.gameSessionController =
      gameSessionController;

    this.accountStore =
      accountStore;

    this.mode =
      'virtual';

    this.playerCounter =
      0;


    this.formElement =
      null;

    this.playersElement =
      null;

    this.addPlayerButton =
      null;

    this.backButton =
      null;

    this.errorElement =
      null;


    this.handleSubmit =
      null;

    this.handleAddPlayer =
      null;

    this.handlePlayerActions =
      null;

    this.handleCharacterChange =
      null;

    this.handleBack =
      null;
  }

  /*
  * =========================================================
  * AUSGERÜSTETEN SKIN ERMITTELN
  * =========================================================
  */

  #getEquippedSkinId(
    characterId,
  ) {
    const {
      isAuthenticated,
      inventory,
      equippedCosmetics,
    } =
      this.accountStore
        .getState();


    /*
    * Ohne Account wird immer der
    * Standardcharakter verwendet.
    */

    if (
      !isAuthenticated
    ) {
      return null;
    }


    /*
    * Ausrüstungsslot dieses Charakters.
    */

    const slotKey =
      `character:${characterId}`;


    const skinId =
      equippedCosmetics?.[
        slotKey
      ] ??
      null;


    if (
      !skinId
    ) {
      return null;
    }


    /*
    * Prüfen, ob der Skin tatsächlich
    * im geladenen Inventory enthalten ist.
    */

    const isOwned =
      inventory.some(
        (item) =>
          item.cosmetic_id ===
          skinId,
      );


    if (
      !isOwned
    ) {
      return null;
    }


    /*
    * Prüfen, ob der Skin zum
    * ausgewählten Charakter gehört.
    */

    const skin =
      getCharacterSkinById(
        skinId,
      );


    if (
      !skin ||
      skin.characterId !==
        characterId
    ) {
      return null;
    }


    return skinId;
  }

  /*
   * =======================================================
   * MOUNT
   * =======================================================
   */

  mount(
    rootElement,
    params = {},
  ) {
    this.mode =
      params.mode ===
      'scoreboard'
        ? 'scoreboard'
        : 'virtual';


    this.playerCounter =
      0;


    if (
      !Array.isArray(
        CHARACTERS,
      ) ||
      CHARACTERS.length === 0
    ) {
      throw new Error(
        'Es sind keine Charaktere konfiguriert.',
      );
    }


    const modeLabel =
      this.mode ===
      'scoreboard'
        ? 'Scoreboard'
        : 'Virtuell';


    rootElement.innerHTML = `
      <main
        class="
          screen
          player-setup
          player-setup-screen
        "
      >

        <!--
          ===================================================
          ACCESSIBLE TITLE
          ===================================================
        -->

        <h1
          class="player-setup__accessible-title"
        >
          Spieler auswählen
        </h1>


        <!--
          ===================================================
          TITLE ASSET
          ===================================================
        -->

        <div
          class="player-setup__title"
          aria-hidden="true"
        ></div>


        <!--
          ===================================================
          MAIN PANEL
          ===================================================
        -->

        <section
          class="player-setup__panel"
        >

          <form
            class="player-setup__form"
            data-player-setup-form
          >

            <!--
              ===============================================
              PLAYER ROWS
              ===============================================
            -->

            <div
              class="player-setup__players"
              data-player-list
            ></div>


            <!--
              ===============================================
              ERROR
              ===============================================
            -->

            <p
              class="player-setup__error"
              data-error
              aria-live="polite"
            ></p>


            <!--
              ===============================================
              ACTIONS
              ===============================================
            -->

            <div
              class="player-setup__actions"
            >

              <div
                class="
                  player-setup__action-slot
                  player-setup__action-slot--back
                "
              >
                <button
                  type="button"
                  class="
                    player-setup__asset-button
                    player-setup__asset-button--back
                  "
                  data-action="back"
                  aria-label="Zurück zur Modusauswahl"
                ></button>
              </div>


              <div
                class="
                  player-setup__action-slot
                  player-setup__action-slot--add
                "
              >
                <button
                  type="button"
                  class="
                    player-setup__asset-button
                    player-setup__asset-button--add
                  "
                  data-action="add-player"
                  aria-label="Spieler hinzufügen"
                ></button>
              </div>


              <div
                class="
                  player-setup__action-slot
                  player-setup__action-slot--start
                "
              >
                <button
                  type="submit"
                  class="
                    player-setup__asset-button
                    player-setup__asset-button--start
                  "
                  aria-label="Spiel starten"
                ></button>
              </div>

            </div>

          </form>

        </section>

      </main>
    `;


    /*
     * =====================================================
     * DOM REFERENCES
     * =====================================================
     */

    this.formElement =
      rootElement.querySelector(
        '[data-player-setup-form]',
      );


    this.playersElement =
      rootElement.querySelector(
        '[data-player-list]',
      );


    this.addPlayerButton =
      rootElement.querySelector(
        '[data-action="add-player"]',
      );


    this.backButton =
      rootElement.querySelector(
        '[data-action="back"]',
      );


    this.errorElement =
      rootElement.querySelector(
        '[data-error]',
      );


    if (
      !(
        this.formElement instanceof
        HTMLFormElement
      ) ||
      !(
        this.playersElement instanceof
        HTMLElement
      ) ||
      !(
        this.addPlayerButton instanceof
        HTMLButtonElement
      ) ||
      !(
        this.backButton instanceof
        HTMLButtonElement
      ) ||
      !(
        this.errorElement instanceof
        HTMLElement
      )
    ) {
      throw new Error(
        'PlayerSetup konnte nicht vollständig initialisiert werden.',
      );
    }

    /*
     * =====================================================
     * EVENT HANDLERS
     * =====================================================
     */

    this.handleSubmit =
      this.#handleSubmit.bind(
        this,
      );
  
    this.handleAddPlayer =
      () => {
        this.#addPlayerRow();
      };


    this.handlePlayerActions =
      this.#handlePlayerActions.bind(
        this,
      );


    this.handleCharacterChange =
      this.#handleCharacterChange.bind(
        this,
      );


    this.handleBack =
      () => {
        this.navigate(
          SCREENS.MODE_SELECT,
        );
      };


    /*
     * =====================================================
     * LISTENERS
     * =====================================================
     */

    this.formElement
      .addEventListener(
        'submit',
        this.handleSubmit,
      );


    this.addPlayerButton
      .addEventListener(
        'click',
        this.handleAddPlayer,
      );


    /*
     * Event Delegation für dynamisch
     * erzeugte Remove-Buttons.
     */
    this.playersElement
      .addEventListener(
        'click',
        this.handlePlayerActions,
      );


    /*
     * Ebenfalls Event Delegation für
     * Character-Selects.
     */
    this.playersElement
      .addEventListener(
        'change',
        this.handleCharacterChange,
      );


    this.backButton
      .addEventListener(
        'click',
        this.handleBack,
      );


    /*
     * =====================================================
     * DEFAULT PLAYERS
     * =====================================================
     *
     * Setup beginnt wie bisher mit zwei Spielern.
     */

    this.#addPlayerRow();

    this.#addPlayerRow();
  }


  /*
   * =======================================================
   * ADD PLAYER
   * =======================================================
   */

  #addPlayerRow() {
    const playerNumber =
      this.playerCounter +
      1;


    const defaultCharacter =
      CHARACTERS[
        this.playerCounter %
        CHARACTERS.length
      ];


    /*
     * =====================================================
     * ROW
     * =====================================================
     */

    const row =
      document.createElement(
        'div',
      );


    row.className =
      'player-setup__row player-setup__asset-row';


    row.dataset.playerRow =
      'true';


    /*
     * =====================================================
     * NAME FIELD
     * =====================================================
     */

    const nameField =
      document.createElement(
        'label',
      );


    nameField.className =
      'player-setup__field player-setup__field--name';


    const nameLabelText =
      document.createElement(
        'span',
      );


    nameLabelText.className =
      'player-setup__field-label';


    nameLabelText.textContent =
      ``;


    const nameInputFrame =
      document.createElement(
        'div',
      );


    nameInputFrame.className =
      'player-setup__input-frame';


    const nameInput =
      document.createElement(
        'input',
      );


    nameInput.type =
      'text';


    nameInput.name =
      'player-name';


    nameInput.required =
      true;


    nameInput.autocomplete =
      'off';


    nameInput.placeholder =
      `Name Spieler ${playerNumber}`;


    nameInputFrame.append(
      nameInput,
    );


    nameField.append(
      nameLabelText,
      nameInputFrame,
    );


    /*
     * =====================================================
     * CHARACTER FIELD
     * =====================================================
     */

    const characterField =
      document.createElement(
        'label',
      );


    characterField.className =
      'player-setup__field player-setup__field--character';


    const characterLabelText =
      document.createElement(
        'span',
      );


    characterLabelText.className =
      'player-setup__field-label';


    characterLabelText.textContent =
      '';


    const characterSelectFrame =
      document.createElement(
        'div',
      );


    characterSelectFrame.className =
      'player-setup__select-frame';


    const characterSelect =
      document.createElement(
        'select',
      );


    characterSelect.name =
      'character-id';


    characterSelect.required =
      true;


    for (
      const character
      of CHARACTERS
    ) {
      const option =
        document.createElement(
          'option',
        );


      option.value =
        character.id;


      option.textContent =
        character.name;


      if (
        character.id ===
        defaultCharacter.id
      ) {
        option.selected =
          true;
      }


      characterSelect.append(
        option,
      );
    }


    characterSelectFrame.append(
      characterSelect,
    );


    characterField.append(
      characterLabelText,
      characterSelectFrame,
    );


    /*
     * =====================================================
     * CHARACTER PORTRAIT
     * =====================================================
     */

    const portraitFrame =
      document.createElement(
        'div',
      );


    portraitFrame.className =
      'player-setup__portrait-frame';


    const portrait =
      document.createElement(
        'img',
      );


    portrait.className =
      'player-setup__portrait';


    portrait.dataset.characterPortrait =
      'true';


    const defaultAppearance =
      resolveCharacterAppearance(
        defaultCharacter.id,

        this.#getEquippedSkinId(
          defaultCharacter.id,
        ),
      );


    portrait.alt =
      defaultAppearance?.name ??
      defaultCharacter.name;


    if (
      defaultAppearance?.portrait
    ) {
      portrait.src =
        defaultAppearance.portrait;
    }


    portraitFrame.append(
      portrait,
    );


    /*
     * =====================================================
     * REMOVE
     * =====================================================
     */

    const removeSlot =
      document.createElement(
        'div',
      );


    removeSlot.className =
      'player-setup__remove-slot';


    const removeButton =
      document.createElement(
        'button',
      );


    removeButton.type =
      'button';


    removeButton.className =
      'player-setup__remove-button';


    removeButton.dataset.action =
      'remove-player';


    removeButton.setAttribute(
      'aria-label',
      `Spieler ${playerNumber} entfernen`,
    );


    removeSlot.append(
      removeButton,
    );


    /*
     * =====================================================
     * APPEND
     * =====================================================
     */

    row.append(
      nameField,
      characterField,
      portraitFrame,
      removeSlot,
    );


    this.playersElement
      .append(
        row,
      );


    this.playerCounter +=
      1;


    this.#syncRemoveButtons();

    this.#renumberPlayerRows();


    /*
     * Komfort wie bisher:
     * neues Namensfeld direkt fokussieren.
     */
    nameInput.focus();
  }


  /*
   * =======================================================
   * CHARACTER CHANGE
   * =======================================================
   */

  #handleCharacterChange(
    event,
  ) {
    const select =
      event.target.closest(
        '[name="character-id"]',
      );


    if (
      !(
        select instanceof
        HTMLSelectElement
      )
    ) {
      return;
    }


    const row =
      select.closest(
        '[data-player-row]',
      );


    if (!row) {
      return;
    }


    const portrait =
      row.querySelector(
        '[data-character-portrait]',
      );


    if (
      !(
        portrait instanceof
        HTMLImageElement
      )
    ) {
      return;
    }


    const appearance =
      resolveCharacterAppearance(
        select.value,

        this.#getEquippedSkinId(
          select.value,
        ),
      );


    if (
      !appearance
    ) {
      portrait.removeAttribute(
        'src',
      );

      portrait.alt =
        'Kein Charakter';

      return;
    }


    portrait.alt =
      appearance.name;


    if (
      appearance.portrait
    ) {
      portrait.src =
        appearance.portrait;
    }
    else {
      portrait.removeAttribute(
        'src',
      );
    }


    portrait.alt =
      character.name;


    if (
      character.portrait
    ) {
      portrait.src =
        character.portrait;

    } else {
      portrait
        .removeAttribute(
          'src',
        );
    }
  }


  /*
   * =======================================================
   * PLAYER ACTIONS
   * =======================================================
   */

  #handlePlayerActions(
    event,
  ) {
    const removeButton =
      event.target.closest(
        '[data-action="remove-player"]',
      );


    if (!removeButton) {
      return;
    }


    const row =
      removeButton.closest(
        '[data-player-row]',
      );


    if (!row) {
      return;
    }


    /*
     * Mindestens ein Spieler bleibt bestehen.
     */
    if (
      this.#getPlayerRows()
        .length <=
      1
    ) {
      this.#showError(
        'Mindestens ein Spieler wird benötigt.',
      );


      return;
    }


    row.remove();


    this.#clearError();

    this.#syncRemoveButtons();

    this.#renumberPlayerRows();
  }


  /*
   * =======================================================
   * SUBMIT
   * =======================================================
   */

  #handleSubmit(
    event,
  ) {
    event.preventDefault();


    this.#clearError();


    try {
      const playerRows =
        this.#getPlayerRows();


      const playerInputs =
        playerRows.map(
          (row) => {
            const nameInput =
              row.querySelector(
                '[name="player-name"]',
              );


            const characterSelect =
              row.querySelector(
                '[name="character-id"]',
              );


            if (
              !nameInput ||
              !characterSelect
            ) {
              throw new Error(
                'Spielerdaten konnten nicht gelesen werden.',
              );
            }


            return {
              name:
                nameInput
                  .value
                  .trim(),

              characterId:
                characterSelect
                  .value,

              skinId:
                this.#getEquippedSkinId(
                  characterSelect.value,
                ),
            };
          },
        );


      /*
       * Controller erzeugt die echten Player.
       */
      const players =
        this.playerSetupController
          .createPlayers(
            playerInputs,
          );


      /*
       * Neue Session starten.
       */
      this.gameSessionController
        .startGame({
          players,

          mode:
            this.mode,
        });


      const targetScreen =
        this.mode ===
        'scoreboard'
          ? SCREENS
              .SCOREBOARD_GAME
          : SCREENS
              .VIRTUAL_GAME;


      this.navigate(
        targetScreen,
      );

    } catch (
      error
    ) {
      this.#showError(
        error instanceof
        Error
          ? error.message
          : 'Das Spiel konnte nicht gestartet werden.',
      );
    }
  }


  /*
   * =======================================================
   * ROW HELPERS
   * =======================================================
   */

  #getPlayerRows() {
    return [
      ...this.playersElement
        .querySelectorAll(
          '[data-player-row]',
        ),
    ];
  }


  #renumberPlayerRows() {
    const rows =
      this.#getPlayerRows();


    rows.forEach(
      (
        row,
        index,
      ) => {
        const playerNumber =
          index +
          1;


        const nameLabelText =
          row.querySelector(
            '.player-setup__field--name .player-setup__field-label',
          );


        const nameInput =
          row.querySelector(
            '[name="player-name"]',
          );


        const removeButton =
          row.querySelector(
            '[data-action="remove-player"]',
          );


        if (
          nameLabelText
        ) {
          nameLabelText
            .textContent =
            ``;
        }


        if (
          nameInput
        ) {
          nameInput.placeholder =
            `Name Spieler ${playerNumber}`;
        }


        if (
          removeButton
        ) {
          removeButton
            .setAttribute(
              'aria-label',
              `Spieler ${playerNumber} entfernen`,
            );
        }
      },
    );
  }


  #syncRemoveButtons() {
    const rows =
      this.#getPlayerRows();


    const disableRemove =
      rows.length <=
      1;


    for (
      const row
      of rows
    ) {
      const button =
        row.querySelector(
          '[data-action="remove-player"]',
        );


      if (
        button
      ) {
        button.disabled =
          disableRemove;
      }
    }
  }


  /*
   * =======================================================
   * ERROR
   * =======================================================
   */

  #showError(
    message,
  ) {
    if (
      !this.errorElement
    ) {
      return;
    }


    this.errorElement
      .textContent =
      message;
  }


  #clearError() {
    if (
      !this.errorElement
    ) {
      return;
    }


    this.errorElement
      .textContent =
      '';
  }


  /*
   * =======================================================
   * CLEANUP
   * =======================================================
   */

  destroy() {
    this.formElement
      ?.removeEventListener(
        'submit',
        this.handleSubmit,
      );


    this.addPlayerButton
      ?.removeEventListener(
        'click',
        this.handleAddPlayer,
      );


    this.playersElement
      ?.removeEventListener(
        'click',
        this.handlePlayerActions,
      );


    this.playersElement
      ?.removeEventListener(
        'change',
        this.handleCharacterChange,
      );


    this.backButton
      ?.removeEventListener(
        'click',
        this.handleBack,
      );


    this.formElement =
      null;


    this.playersElement =
      null;


    this.addPlayerButton =
      null;


    this.backButton =
      null;


    this.errorElement =
      null;


    this.handleSubmit =
      null;


    this.handleAddPlayer =
      null;


    this.handlePlayerActions =
      null;


    this.handleCharacterChange =
      null;


    this.handleBack =
      null;
  }
}