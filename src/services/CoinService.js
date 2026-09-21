import {
  supabase,
} from '../lib/supabaseClient.js';


const PENDING_REWARDS_KEY =
  'wuerfeln10000:pendingCoinRewards:v1';


export class CoinService {
  constructor(
    accountStore,
  ) {
    this.accountStore =
      accountStore;

    this.isProcessing =
      false;

    /*
     * Nach dem Login oder beim Laden
     * der Accountdaten offene Ereignisse
     * erneut versuchen.
     */
    this.accountStore.subscribe(
      () => {
        void this.processPendingRewards();
      },
    );

    /*
     * Nach einer unterbrochenen
     * Internetverbindung erneut versuchen.
     */
    window.addEventListener(
      'online',
      () => {
        void this.processPendingRewards();
      },
    );
  }


  /*
   * Ein bestätigtes Spielereignis einreihen.
   *
   * Die eventId wird nur EINMAL erzeugt
   * und vor dem Request gespeichert.
   */
  enqueueReward({
    matchId,
    eventType,
    bankedScore,
  }) {
    const {
      user,
      isAuthenticated,
    } =
      this.accountStore.getState();


    /*
     * Ohne Anmeldung keine Coins.
     * Bis einschließlich 1.000 Punkten
     * ebenfalls keine Coins.
     */
    if (
      !isAuthenticated ||
      !user?.id ||
      bankedScore <= 1000
    ) {
      return;
    }


    if (
      !matchId
    ) {
      console.error(
        'Coin-Gutschrift: Partiekennung fehlt.',
      );

      return;
    }


    const rewardEvent = {
      userId:
        user.id,

      eventId:
        crypto.randomUUID(),

      matchId,

      eventType,

      bankedScore,
    };


    /*
     * Vor dem ersten Request speichern.
     * Bei einem Netzwerkfehler bleibt
     * genau dieses Ereignis erhalten.
     */
    try {
      const pending =
        this.#readPendingRewards();

      pending.push(
        rewardEvent,
      );

      this.#savePendingRewards(
        pending,
      );
    }
    catch (
      error
    ) {
      console.error(
        'Coin-Ereignis konnte nicht gespeichert werden:',
        error,
      );

      return;
    }


    void this.processPendingRewards();
  }


  /*
   * Gespeicherte Ereignisse nacheinander
   * an Supabase übermitteln.
   */
  async processPendingRewards() {
    if (
      this.isProcessing
    ) {
      return;
    }


    const {
      user,
      isAuthenticated,
    } =
      this.accountStore.getState();


    if (
      !isAuthenticated ||
      !user?.id
    ) {
      return;
    }


    const userId =
      user.id;


    this.isProcessing =
      true;


    try {
      while (
        this.accountStore
          .getState()
          .user?.id ===
        userId
      ) {
        /*
         * Nur Ereignisse dieses Accounts
         * verarbeiten.
         */
        const pending =
          this.#readPendingRewards();

        const event =
          pending.find(
            (item) =>
              item.userId ===
              userId,
          );


        if (
          !event
        ) {
          break;
        }


        const result =
          await this.awardVirtualGameCoins({
            eventId:
              event.eventId,

            matchId:
              event.matchId,

            eventType:
              event.eventType,

            bankedScore:
              event.bankedScore,
          });


        /*
         * Erst nach der erfolgreichen
         * Supabase-Antwort entfernen.
         *
         * Falls das Entfernen fehlschlägt,
         * verhindert die bestehende
         * Datenbankfunktion eine zweite
         * Gutschrift derselben eventId.
         */
        this.#savePendingRewards(
          this.#readPendingRewards()
            .filter(
              (item) =>
                item.eventId !==
                  event.eventId ||
                item.userId !==
                  event.userId,
            ),
        );


        /*
         * Account könnte während des
         * Requests gewechselt haben.
         */
        if (
          this.accountStore
            .getState()
            .user?.id !==
          userId
        ) {
          break;
        }


        this.accountStore.setCoins(
          result.balance,
        );


        console.info(
          '[Coins] Supabase-Gutschrift',
          {
            bankedScore:
              event.bankedScore,

            awardedCoins:
              result.awarded_coins,

            balance:
              result.balance,

            alreadyProcessed:
              result.already_processed,
          },
        );
      }
    }
    catch (
      error
    ) {
      /*
       * Ereignis bleibt gespeichert.
       * Kein neuer eventId-Wert beim
       * nächsten Versuch!
       */
      console.error(
        'Coin-Gutschrift fehlgeschlagen. Das Ereignis bleibt für einen erneuten Versuch gespeichert:',
        error,
      );
    }
    finally {
      this.isProcessing =
        false;


      /*
       * Wurde zwischenzeitlich ein anderer
       * Account angemeldet, dessen offene
       * Ereignisse ebenfalls prüfen.
       */
      if (
        this.accountStore
          .getState()
          .user?.id !==
        userId
      ) {
        void this.processPendingRewards();
      }
    }
  }


  /*
   * Bestehende Supabase-RPC.
   */
  async awardVirtualGameCoins({
    eventId,
    matchId,
    eventType,
    bankedScore,
  }) {
    const {
      data,
      error,
    } = await supabase.rpc(
      'award_virtual_game_coins',
      {
        p_event_id:
          eventId,

        p_match_id:
          matchId,

        p_event_type:
          eventType,

        p_banked_score:
          bankedScore,
      },
    );


    if (
      error
    ) {
      throw error;
    }


    return data;
  }


  #readPendingRewards() {
    const stored =
      localStorage.getItem(
        PENDING_REWARDS_KEY,
      );


    if (
      !stored
    ) {
      return [];
    }


    const parsed =
      JSON.parse(
        stored,
      );


    return Array.isArray(
      parsed,
    )
      ? parsed
      : [];
  }


  #savePendingRewards(
    events,
  ) {
    localStorage.setItem(
      PENDING_REWARDS_KEY,
      JSON.stringify(
        events,
      ),
    );
  }
}