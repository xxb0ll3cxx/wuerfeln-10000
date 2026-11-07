const RETRY_DELAYS_MS =
  [
    0,
    300,
    1000,
  ];


function delay(
  milliseconds,
) {
  return new Promise(
    (resolve) => {
      setTimeout(
        resolve,
        milliseconds,
      );
    },
  );
}


export class OnlineCoinRewardService {
  constructor(
    supabase,
  ) {
    if (!supabase) {
      throw new Error(
        'OnlineCoinRewardService benötigt Supabase.',
      );
    }


    this.supabase =
      supabase;
  }


  async awardReward({
    userId,
    eventId,
    matchId,
    eventType,
    bankedScore,
  }) {
    let lastError =
      null;


    for (
      const retryDelay
      of RETRY_DELAYS_MS
    ) {
      if (
        retryDelay >
        0
      ) {
        await delay(
          retryDelay,
        );
      }


      const {
        data,
        error,
      } =
        await this.supabase
          .rpc(
            'award_online_game_coins',
            {
              p_user_id:
                userId,

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


      if (!error) {
        return data;
      }


      lastError =
        error;
    }


    throw (
      lastError ??
      new Error(
        'Online-Coin-Gutschrift fehlgeschlagen.',
      )
    );
  }
}