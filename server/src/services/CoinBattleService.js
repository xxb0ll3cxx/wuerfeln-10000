export class CoinBattleService {
  constructor(
    supabase,
  ) {
    if (!supabase) {
      throw new Error(
        'CoinBattleService benötigt Supabase.',
      );
    }


    this.supabase =
      supabase;
  }


  async reserveBattle({
    battleId,
    roomId,
    player1UserId,
    player2UserId,
    wagerCoins,
  }) {
    const {
      data,
      error,
    } =
      await this.supabase
        .rpc(
          'reserve_coin_battle',
          {
            p_battle_id:
              battleId,

            p_room_id:
              roomId,

            p_player_1_user_id:
              player1UserId,

            p_player_2_user_id:
              player2UserId,

            p_wager_coins:
              wagerCoins,
          },
        );


    if (error) {
      throw new Error(
        error.message,
      );
    }


    return data;
  }


  async markBattleStarted({
    battleId,
    matchId,
  }) {
    const {
      data,
      error,
    } =
      await this.supabase
        .rpc(
          'mark_coin_battle_started',
          {
            p_battle_id:
              battleId,

            p_match_id:
              matchId,
          },
        );


    if (error) {
      throw new Error(
        error.message,
      );
    }


    return data;
  }
    async settleBattle({
    battleId,
    winnerUserId,
    reason,
    }) {
    const {
        data,
        error,
    } =
        await this.supabase
        .rpc(
            'settle_coin_battle',
            {
            p_battle_id:
                battleId,

            p_winner_user_id:
                winnerUserId,

            p_reason:
                reason,
            },
        );


    if (error) {
        throw new Error(
        error.message,
        );
    }


    return data;
    }

  async refundReservedBattle({
    battleId,
  }) {
    const {
      data,
      error,
    } =
      await this.supabase
        .rpc(
          'refund_reserved_coin_battle',
          {
            p_battle_id:
              battleId,
          },
        );


    if (error) {
      throw new Error(
        error.message,
      );
    }


    return data;
  }
}