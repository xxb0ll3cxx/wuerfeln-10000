import {
  SCREENS,
} from '../app/screens.js';

import {
  MULTIPLAYER_MODES,
  getMultiplayerMode,
} from '../../shared/config/multiplayerModes.js';
import {
  CHARACTERS,
  getCharacterById,
} from '../config/characters.js';

import {
  getCharacterSkinById,
} from '../config/characterSkins.js';

import {
  getDiceSkinById,
} from '../config/diceSkins.js';

const STATUS_LABELS =
  Object.freeze({
    idle:
      'Nicht verbunden',

    connecting:
      'Verbinde...',

    connected:
      'Verbunden',

    reconnecting:
      'Verbindung wird wiederhergestellt...',

    disconnected:
      'Getrennt',

    error:
      'Verbindungsfehler',
  });


export class LobbyScreen {
constructor({
  navigate,
  multiplayerClient,
  accountStore,
  }) {
    this.navigate =
      navigate;

    this.multiplayerClient =
      multiplayerClient;

    this.accountStore =
      accountStore;

    this.roomCodeElement =
      null;

    this.statusElement =
      null;

    this.statusIconElement =
      null;

    this.coinsElement =
      null;

    this.characterPreviewElement =
      null;

    this.playersElement =
      null;

    this.errorElement =
      null;

    this.leaveButton =
      null;


    this.modeSelect =
      null;

    this.targetScoreInput =
      null;

    this.targetScoreValue =
      null;

    this.wagerContainer =
      null;

    this.wagerInput =
      null;

    this.wagerValue =
      null;

    this.acceptButton =
      null;

    this.acceptStatusElement =
      null;


    this.handleLeave =
      null;

    this.handleModeChange =
      null;

    this.handleTargetInput =
      null;

    this.handleTargetChange =
      null;

    this.handleWagerInput =
      null;

    this.handleWagerChange =
      null;

    this.handleAccept =
      null;

    this.startButton =
    null;

    this.handleStart =
    null;

    this.isNavigatingToGame =
    false;

    this.unsubscribeMultiplayer =
      null;

    this.characterSelect =
      null;

    this.characterSkinElement =
      null;

    this.diceSkinElement =
      null;

    this.unsubscribeAccount =
      null;
    this.handleCharacterChange =
      null;
  }


  mount(
    rootElement,
  ) {
rootElement.innerHTML = `
  <main
    class="screen lobby-screen"
  >
    <header
      class="lobby-screen__header"
    >
      <h1
        class="lobby-screen__title"
      >
        Lobby
      </h1>

      <p
        class="lobby-screen__room-code"
      >
        Room-Code:
        <strong
          data-lobby-room-code
        >
          —
        </strong>
      </p>

      <div
        class="lobby-screen__account-status"
      >
        <div
          class="lobby-screen__coins"
        >
          <span
            class="lobby-screen__coin-icon"
            aria-hidden="true"
          ></span>

          <strong
            data-lobby-coins
          >
            0
          </strong>
        </div>

        <div
          class="lobby-screen__connection"
        >
          <span>
            Verbindung:
          </span>

          <span
            class="lobby-screen__connection-icon"
            data-lobby-connection-icon
            data-connected="false"
            aria-hidden="true"
          ></span>

          <span
            class="lobby-screen__sr-only"
            data-lobby-status
          >
            —
          </span>
        </div>
      </div>
    </header>


    <section
      class="lobby-screen__players-shell"
      aria-label="Spieler in der Lobby"
    >
      <ul
        class="lobby-screen__players"
        data-lobby-players
      ></ul>
    </section>


    <section
      class="lobby-screen__controls"
    >
      <div
        class="lobby-screen__settings"
      >
        <label
          class="
            lobby-screen__field
            lobby-screen__field--mode
          "
        >
          <span>
            Spielmodus
          </span>

          <select
            data-lobby-mode
          ></select>
        </label>


        <label
          class="
            lobby-screen__field
            lobby-screen__field--target
          "
        >
          <span>
            Zielpunkte
          </span>

          <input
            type="range"
            data-lobby-target-score
          >

          <output
            data-lobby-target-score-value
          >
            —
          </output>
        </label>


        <div
          class="
            lobby-screen__field
            lobby-screen__field--wager
          "
          data-lobby-wager-container
          data-enabled="false"
        >
          <label>
            <span>
              Coin-Einsatz
            </span>

            <input
              type="range"
              data-lobby-wager
              disabled
            >

            <output
              data-lobby-wager-value
            >
              —
            </output>
          </label>
        </div>
      </div>


      <div
        class="lobby-screen__selection"
      >
        <label
          class="
            lobby-screen__field
            lobby-screen__field--character
          "
        >
          <span>
            Charakter
          </span>

          <select
            data-lobby-character
          >
            <option value="">
              Charakter wählen…
            </option>
          </select>
        </label>


        <div
          class="lobby-screen__selection-details"
        >
          <span>
            Skin:
            <strong
              data-lobby-character-skin
            >
              Standard
            </strong>
          </span>

          <span>
            Würfel:
            <strong
              data-lobby-dice-skin
            >
              Standard
            </strong>
          </span>
        </div>


        <button
          type="button"
          class="
            lobby-screen__asset-button
            lobby-screen__accept-button
          "
          data-action="accept-settings"
          aria-label="Einstellungen akzeptieren"
        ></button>


        <p
          class="lobby-screen__accept-status"
          data-lobby-accept-status
        ></p>
      </div>


      <figure
        class="lobby-screen__preview"
        aria-hidden="true"
      >
        <img
          class="lobby-screen__preview-image"
          data-lobby-character-preview
          alt=""
          hidden
        >
      </figure>
    </section>


    <p
      class="lobby-screen__error"
      data-lobby-error
      role="alert"
    ></p>


    <button
      type="button"
      class="
        lobby-screen__asset-button
        lobby-screen__start-button
      "
      data-action="start-game"
      aria-label="Spiel starten"
    ></button>


    <button
      type="button"
      class="
        lobby-screen__asset-button
        lobby-screen__leave-button
      "
      data-action="leave-lobby"
      aria-label="Lobby verlassen"
    ></button>
  </main>
`;

    this.startButton =
    rootElement.querySelector(
        '[data-action="start-game"]',
    );
    this.roomCodeElement =
      rootElement.querySelector(
        '[data-lobby-room-code]',
      );


    this.statusElement =
      rootElement.querySelector(
        '[data-lobby-status]',
      );

    this.statusIconElement =
      rootElement.querySelector(
        '[data-lobby-connection-icon]',
      );


    this.coinsElement =
      rootElement.querySelector(
        '[data-lobby-coins]',
      );


    this.characterPreviewElement =
      rootElement.querySelector(
        '[data-lobby-character-preview]',
      );

    this.playersElement =
      rootElement.querySelector(
        '[data-lobby-players]',
      );


    this.errorElement =
      rootElement.querySelector(
        '[data-lobby-error]',
      );


    this.leaveButton =
      rootElement.querySelector(
        '[data-action="leave-lobby"]',
      );


    this.modeSelect =
      rootElement.querySelector(
        '[data-lobby-mode]',
      );


    this.targetScoreInput =
      rootElement.querySelector(
        '[data-lobby-target-score]',
      );


    this.targetScoreValue =
      rootElement.querySelector(
        '[data-lobby-target-score-value]',
      );


    this.wagerContainer =
      rootElement.querySelector(
        '[data-lobby-wager-container]',
      );


    this.wagerInput =
      rootElement.querySelector(
        '[data-lobby-wager]',
      );


    this.wagerValue =
      rootElement.querySelector(
        '[data-lobby-wager-value]',
      );


    this.acceptButton =
      rootElement.querySelector(
        '[data-action="accept-settings"]',
      );


    this.acceptStatusElement =
      rootElement.querySelector(
        '[data-lobby-accept-status]',
      );

    this.characterSelect =
      rootElement.querySelector(
        '[data-lobby-character]',
      );


    this.characterSkinElement =
      rootElement.querySelector(
        '[data-lobby-character-skin]',
      );


    this.diceSkinElement =
      rootElement.querySelector(
        '[data-lobby-dice-skin]',
      );
    /*
     * Spielmodi zentral aus der Shared-Config erzeugen.
     */
    for (
      const mode
      of Object.values(
        MULTIPLAYER_MODES,
      )
    ) {
      const option =
        document.createElement(
          'option',
        );


      option.value =
        mode.id;


      option.textContent =
        mode.name;


      this.modeSelect
        ?.append(
          option,
        );
    }
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


      this.characterSelect
        ?.append(
          option,
        );
    }
    this.handleCharacterChange =
      () => {
        const characterId =
          this.characterSelect
            ?.value ||
          null;


        this.#sendLocalPlayerSetup(
          characterId,
        );
      };
    this.handleModeChange =
      () => {
        this.multiplayerClient
          .updateRoomSettings({
            gameModeId:
              this.modeSelect
                ?.value,
          });
      };


    this.handleTargetInput =
      () => {
        if (
          !this.targetScoreInput ||
          !this.targetScoreValue
        ) {
          return;
        }


        this.targetScoreValue
          .textContent =
          Number(
            this.targetScoreInput
              .value,
          )
            .toLocaleString(
              'de-DE',
            );
      };

    this.handleStart =
    () => {
        this.multiplayerClient
        .startGame();
    };

    this.handleTargetChange =
      () => {
        this.multiplayerClient
          .updateRoomSettings({
            targetScore:
              Number(
                this.targetScoreInput
                  ?.value,
              ),
          });
      };


    this.handleWagerInput =
      () => {
        if (
          !this.wagerInput ||
          !this.wagerValue
        ) {
          return;
        }


        this.wagerValue
          .textContent =
          `${Number(
            this.wagerInput.value,
          ).toLocaleString(
            'de-DE',
          )} Coins`;
      };


    this.handleWagerChange =
      () => {
        this.multiplayerClient
          .updateRoomSettings({
            wagerCoins:
              Number(
                this.wagerInput
                  ?.value,
              ),
          });
      };


    this.handleAccept =
      () => {
        this.multiplayerClient
          .acceptRoomSettings();
      };


    this.handleLeave =
      () => {
        this.multiplayerClient
          .disconnect();


        this.navigate(
          SCREENS.ONLINE_MENU,
        );
      };

    this.characterSelect
      ?.addEventListener(
        'change',
        this.handleCharacterChange,
      );

    this.modeSelect
      ?.addEventListener(
        'change',
        this.handleModeChange,
      );
    this.startButton
    ?.addEventListener(
        'click',
        this.handleStart,
    );

    this.targetScoreInput
      ?.addEventListener(
        'input',
        this.handleTargetInput,
      );


    this.targetScoreInput
      ?.addEventListener(
        'change',
        this.handleTargetChange,
      );


    this.wagerInput
      ?.addEventListener(
        'input',
        this.handleWagerInput,
      );


    this.wagerInput
      ?.addEventListener(
        'change',
        this.handleWagerChange,
      );


    this.acceptButton
      ?.addEventListener(
        'click',
        this.handleAccept,
      );


    this.leaveButton
      ?.addEventListener(
        'click',
        this.handleLeave,
      );


    this.unsubscribeMultiplayer =
      this.multiplayerClient
        .subscribe(
          (
            state,
          ) => {
            this.#renderState(
              state,
            );


            this.#syncLocalProfile(
              state,
            );
          },
        );


      this.unsubscribeAccount =
        this.accountStore
          .subscribe(
            () => {
              const multiplayerState =
                this.multiplayerClient
                  .getState();


              this.#renderState(
                multiplayerState,
              );


              this.#syncLocalProfile(
                multiplayerState,
              );
            },
          );
  }
#getEquippedCharacterSkinId(
  characterId,
) {
  const {
    isAuthenticated,
    inventory,
    equippedCosmetics,
  } =
    this.accountStore
      .getState();


  if (
    !isAuthenticated ||
    !characterId
  ) {
    return null;
  }


  const skinId =
    equippedCosmetics?.[
      `character:${characterId}`
    ] ??
    null;


  if (!skinId) {
    return null;
  }


  const isOwned =
    inventory.some(
      (item) =>
        item.cosmetic_id ===
        skinId,
    );


  const skin =
    getCharacterSkinById(
      skinId,
    );


  if (
    !isOwned ||
    !skin ||
    skin.characterId !==
      characterId
  ) {
    return null;
  }


  return skinId;
}


#getEquippedDiceSkinId() {
  const {
    isAuthenticated,
    inventory,
    equippedCosmetics,
  } =
    this.accountStore
      .getState();


  if (!isAuthenticated) {
    return null;
  }


  const skinId =
    equippedCosmetics?.dice ??
    null;


  if (!skinId) {
    return null;
  }


  const isOwned =
    inventory.some(
      (item) =>
        item.cosmetic_id ===
        skinId,
    );


  const skin =
    getDiceSkinById(
      skinId,
    );


  if (
    !isOwned ||
    !skin
  ) {
    return null;
  }


  return skinId;
}


#buildLocalPlayerSetup(
  characterId,
) {
  const accountState =
    this.accountStore
      .getState();


  const isAuthenticated =
    accountState
      .isAuthenticated ===
    true;


  const username =
    typeof accountState
      .username ===
      'string'
      ? accountState
          .username
          .trim()
      : '';


  return {
    displayName:
      isAuthenticated
        ? (
            username ||
            'Spieler'
          )
        : 'Gast',

    isAuthenticated,

    accountId:
      isAuthenticated &&
      typeof accountState
        .user
        ?.id ===
        'string'
        ? accountState
            .user
            .id
        : null,

    characterId:
      characterId ||
      null,

    skinId:
      isAuthenticated
        ? this
            .#getEquippedCharacterSkinId(
              characterId,
            )
        : null,

    diceSkinId:
      isAuthenticated
        ? this
            .#getEquippedDiceSkinId()
        : null,
  };
}


#sendLocalPlayerSetup(
  characterId,
) {
  const accountState =
    this.accountStore
      .getState();


  if (
    accountState.isLoading
  ) {
    return false;
  }


  return this.multiplayerClient
    .updateRoomPlayerSetup(
      this.#buildLocalPlayerSetup(
        characterId,
      ),
    );
}


#syncLocalProfile(
  state,
) {
  const accountState =
    this.accountStore
      .getState();


  if (
    accountState.isLoading
  ) {
    return;
  }


  const room =
    state.currentRoom;


  if (!room) {
    return;
  }


  const localPlayer =
    room.players.find(
      (player) =>
        player.id ===
        state.localPlayerId,
    ) ??
    null;


  if (!localPlayer) {
    return;
  }


  const desired =
    this.#buildLocalPlayerSetup(
      localPlayer.characterId ??
      null,
    );


  const alreadyCurrent =
    localPlayer.displayName ===
      desired.displayName &&
    Boolean(
      localPlayer.isAuthenticated,
    ) ===
      desired.isAuthenticated &&
    (
      localPlayer.characterId ??
      null
    ) ===
      desired.characterId &&
    (
      localPlayer.skinId ??
      null
    ) ===
      desired.skinId &&
    (
      localPlayer.diceSkinId ??
      null
    ) ===
      desired.diceSkinId;


  if (alreadyCurrent) {
    return;
  }


  this.multiplayerClient
    .updateRoomPlayerSetup(
      desired,
    );
}

  #renderState(
    state,
  ) {
    const room =
      state.currentRoom;


    if (
      this.statusElement
    ) {
      this.statusElement
        .textContent =
        STATUS_LABELS[
          state.status
        ] ??
        state.status;
    }
    if (
      this.statusIconElement
    ) {
      this.statusIconElement
        .dataset.connected =
        state.status ===
          'connected'
          ? 'true'
          : 'false';
    }


    if (
      this.coinsElement
    ) {
      const accountState =
        this.accountStore
          .getState();


      const coins =
        Number(
          accountState.coins ??
          0,
        );


      this.coinsElement
        .textContent =
        Number.isFinite(
          coins,
        )
          ? coins.toLocaleString(
              'de-DE',
            )
          : '0';
    }

    if (
      this.errorElement
    ) {
      this.errorElement
        .textContent =
        state.roomError
          ?.message ??
        state.error ??
        '';
    }


    if (
      this.roomCodeElement
    ) {
      this.roomCodeElement
        .textContent =
        room?.id ??
        '—';
    }


    if (!room) {
      return;
    }


    const localPlayer =
      room.players.find(
        (player) =>
          player.id ===
          state.localPlayerId,
      ) ??
      null;

    if (
      this.characterSelect
    ) {
      this.characterSelect.value =
        localPlayer
          ?.characterId ??
        '';

      this.characterSelect.disabled =
        !localPlayer;
    }
    const localCharacter =
      localPlayer?.characterId
        ? getCharacterById(
            localPlayer.characterId,
          )
        : null;

    const localCharacterSkin =
      localPlayer?.skinId
        ? getCharacterSkinById(
            localPlayer.skinId,
          )
        : null;


    if (
      this.characterSkinElement
    ) {
      this.characterSkinElement
        .textContent =
        localCharacterSkin
          ?.name ??
        'Standard';
    }


    const localDiceSkin =
      localPlayer?.diceSkinId
        ? getDiceSkinById(
            localPlayer.diceSkinId,
          )
        : null;


    if (
      this.diceSkinElement
    ) {
      this.diceSkinElement
        .textContent =
        localDiceSkin
          ?.name ??
        'Standard';
    }
    if (
      this.characterPreviewElement
    ) {
      const previewFrame =
        localCharacterSkin
          ?.sprite
          ?.neutralFrame ??
        localCharacter
          ?.sprite
          ?.neutralFrame ??
        null;


      if (previewFrame) {
        this.characterPreviewElement.src =
          previewFrame;

        this.characterPreviewElement.hidden =
          false;
      }
      else {
        this.characterPreviewElement
          .removeAttribute(
            'src',
          );

        this.characterPreviewElement.hidden =
          true;
      }
    }
    const isHost =
      localPlayer?.id ===
      room.hostPlayerId;


    const mode =
      getMultiplayerMode(
        room.settings
          .gameModeId,
      );


    if (!mode) {
      return;
    }

    if (
    room.status ===
        'playing' &&
    room.match &&
    !this.isNavigatingToGame
    ) {
    this.isNavigatingToGame =
        true;


    this.navigate(
        SCREENS.ONLINE_GAME,
    );


    return;
    }

    /*
     * =====================================================
     * MODE
     * =====================================================
     */

    if (
      this.modeSelect
    ) {
      this.modeSelect.value =
        mode.id;


      this.modeSelect.disabled =
        !isHost;
    }

    if (
      this.startButton
    ) {
      const allPlayersAuthenticated =
        room.players.length ===
          2 &&
        room.players.every(
          (player) =>
            player
              .isAuthenticated ===
              true,
        );


      const accountRequirementMissing =
        mode.usesWager &&
        !allPlayersAuthenticated;


      this.startButton.hidden =
        !isHost;


      this.startButton.disabled =
        !room.canStart ||
        accountRequirementMissing;


      this.startButton
        .dataset.state =
        accountRequirementMissing
          ? 'account-required'
          : room.canStart
            ? 'ready'
            : 'waiting';


      this.startButton
        .setAttribute(
          'aria-label',
          accountRequirementMissing
            ? 'Coin Battle benötigt zwei Accounts'
            : room.canStart
              ? 'Spiel starten'
              : 'Warte auf Zustimmung',
        );
    }
    /*
     * =====================================================
     * TARGET SCORE
     * =====================================================
     */

    if (
      this.targetScoreInput
    ) {
      this.targetScoreInput.min =
        String(
          mode.targetScore.min,
        );


      this.targetScoreInput.max =
        String(
          mode.targetScore.max,
        );


      this.targetScoreInput.step =
        String(
          mode.targetScore.step,
        );


      this.targetScoreInput.value =
        String(
          room.settings
            .targetScore,
        );


      this.targetScoreInput.disabled =
        !isHost;
    }


    if (
      this.targetScoreValue
    ) {
      this.targetScoreValue
        .textContent =
        Number(
          room.settings
            .targetScore,
        )
          .toLocaleString(
            'de-DE',
          );
    }


    /*
     * =====================================================
     * WAGER
     * =====================================================
     */

    if (
      this.wagerContainer
    ) {
      this.wagerContainer
        .dataset.enabled =
        mode.usesWager
          ? 'true'
          : 'false';
    }


    if (
      this.wagerInput
    ) {
      if (
        mode.usesWager
      ) {
        this.wagerInput.min =
          String(
            mode.wager.min,
          );


        this.wagerInput.max =
          String(
            mode.wager.max,
          );


        this.wagerInput.step =
          String(
            mode.wager.step,
          );


        this.wagerInput.value =
          String(
            room.settings
              .wagerCoins,
          );
      }
      else {
        this.wagerInput.value =
          '0';
      }


      this.wagerInput.disabled =
        !mode.usesWager ||
        !isHost;
    }


    if (
      this.wagerValue
    ) {
      this.wagerValue
        .textContent =
        mode.usesWager
          ? `${Number(
              room.settings
                .wagerCoins,
            ).toLocaleString(
              'de-DE',
            )} Coins`
          : '—';
    }


    /*
     * =====================================================
     * ACCEPT
     * =====================================================
     */

    const hasAccepted =
      localPlayer
        ?.acceptedSettingsRevision ===
      room.settings.revision;

    const hasSelectedCharacter =
      Boolean(
        localPlayer
          ?.characterId,
      );
    const accountRequired =
      mode.usesWager;


    const accountRequirementMet =
      !accountRequired ||
      localPlayer
        ?.isAuthenticated ===
        true;


    const allPlayersAuthenticated =
      !accountRequired ||
      (
        room.players.length ===
          2 &&
        room.players.every(
          (player) =>
            player
              .isAuthenticated ===
              true,
        )
      );

      const hasValidPlayerCount =
        room.players.length >=
          mode.playerCount.min &&
        room.players.length <=
          mode.playerCount.max;


      const allPlayersSelectedCharacter =
        hasValidPlayerCount &&
        room.players.every(
          (player) =>
            Boolean(
              player.characterId,
            ),
        );

    if (
      this.acceptButton
    ) {
      this.acceptButton.disabled =
        !localPlayer ||
        !hasSelectedCharacter ||
        !accountRequirementMet ||
        hasAccepted;


      const acceptState =
      !accountRequirementMet
        ? 'account-required'
        : !hasSelectedCharacter
          ? 'character-required'
          : hasAccepted
            ? 'accepted'
            : 'ready';


    this.acceptButton
      .dataset.state =
      acceptState;


    this.acceptButton
      .setAttribute(
        'aria-label',
        !accountRequirementMet
          ? 'Für Coin Battle einloggen'
          : !hasSelectedCharacter
            ? 'Zuerst Charakter wählen'
            : hasAccepted
              ? 'Einstellungen akzeptiert'
              : 'Einstellungen akzeptieren',
      );
    }


    if (
      !hasValidPlayerCount
    ) {
      this.acceptStatusElement
        .textContent =
        mode.playerCount.min ===
          mode.playerCount.max
          ? `${mode.name} benötigt genau ${mode.playerCount.min} Spieler.`
          : `${mode.name} benötigt ${mode.playerCount.min} bis ${mode.playerCount.max} Spieler.`;
    }
    else if (
      !allPlayersSelectedCharacter
    ) {
      this.acceptStatusElement
        .textContent =
        'Alle Spieler müssen zuerst einen Charakter wählen.';
    }
    else {
      this.acceptStatusElement
        .textContent =
        room.canStart
          ? 'Alle Spieler haben die Einstellungen akzeptiert.'
          : `Einstellungs-Version: ${room.settings.revision}`;
    }


    /*
     * =====================================================
     * PLAYERS
     * =====================================================
     */

    if (
      this.playersElement
    ) {
      this.playersElement
        .replaceChildren();


      for (
        const player
        of room.players
      ) {
        const item =
          document.createElement(
            'li',
          );


      const accepted =
        player
          .acceptedSettingsRevision ===
        room.settings.revision;


      const character =
        player.characterId
          ? getCharacterById(
              player.characterId,
            )
          : null;


      const characterSkin =
        player.skinId
          ? getCharacterSkinById(
              player.skinId,
            )
          : null;


      const portrait =
        characterSkin
          ?.portrait ??
        character
          ?.portrait ??
        null;


      const playerName =
        player.isAuthenticated
          ? player.displayName
          : 'Gast';


      const skinName =
        characterSkin
          ?.name ??
        'Standard';


      item.className =
        'lobby-player-card';


      item.dataset.ready =
        accepted
          ? 'true'
          : 'false';


      const portraitElement =
        document.createElement(
          'img',
        );


      portraitElement.className =
        'lobby-player-card__portrait';


      portraitElement.alt =
        '';


      if (portrait) {
        portraitElement.src =
          portrait;
      }
      else {
        portraitElement.hidden =
          true;
      }


      const nameElement =
        document.createElement(
          'strong',
        );


      nameElement.className =
        'lobby-player-card__name';


      nameElement.textContent =
        playerName;


      const skinElement =
        document.createElement(
          'span',
        );


      skinElement.className =
        'lobby-player-card__skin';


      skinElement.textContent =
        skinName;


      const readyElement =
        document.createElement(
          'span',
        );


      readyElement.className =
        'lobby-player-card__ready-icon';


      readyElement.dataset.ready =
        accepted
          ? 'true'
          : 'false';


      readyElement.setAttribute(
        'role',
        'img',
      );


      readyElement.setAttribute(
        'aria-label',
        accepted
          ? 'Bereit'
          : 'Nicht bereit',
      );


      item.append(
        portraitElement,
        nameElement,
        skinElement,
        readyElement,
      );


      this.playersElement
        .append(
          item,
        );
      }
    }
  }


  destroy() {
    this.modeSelect
      ?.removeEventListener(
        'change',
        this.handleModeChange,
      );

    this.characterSelect
      ?.removeEventListener(
        'change',
        this.handleCharacterChange,
      );


    this.unsubscribeAccount?.();


    this.unsubscribeAccount =
      null;
      
    this.targetScoreInput
      ?.removeEventListener(
        'input',
        this.handleTargetInput,
      );


    this.targetScoreInput
      ?.removeEventListener(
        'change',
        this.handleTargetChange,
      );


    this.wagerInput
      ?.removeEventListener(
        'input',
        this.handleWagerInput,
      );


    this.wagerInput
      ?.removeEventListener(
        'change',
        this.handleWagerChange,
      );


    this.acceptButton
      ?.removeEventListener(
        'click',
        this.handleAccept,
      );


    this.leaveButton
      ?.removeEventListener(
        'click',
        this.handleLeave,
      );
      
    this.startButton
    ?.removeEventListener(
        'click',
        this.handleStart,
    );

    this.unsubscribeMultiplayer?.();


    this.unsubscribeMultiplayer =
      null;


    this.roomCodeElement =
      null;

    this.statusElement =
      null;
      
    this.statusIconElement =
      null;

    this.coinsElement =
      null;

    this.characterPreviewElement =
      null;

    this.playersElement =
      null;

    this.errorElement =
      null;

    this.leaveButton =
      null;

    this.modeSelect =
      null;

    this.targetScoreInput =
      null;

    this.targetScoreValue =
      null;

    this.wagerContainer =
      null;

    this.wagerInput =
      null;

    this.wagerValue =
      null;

    this.acceptButton =
      null;

    this.acceptStatusElement =
      null;

    this.startButton =
        null;

    this.handleStart =
        null;
  }
}