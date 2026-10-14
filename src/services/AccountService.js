import {
  supabase,
} from '../lib/supabaseClient.js';


export class AccountService {
  async loadAccountData() {
    const [
      profileResult,
      walletResult,
      inventoryResult,
      equippedResult,
    ] =
      await Promise.all([
        this.#loadProfile(),
        this.#loadWallet(),
        this.#loadInventory(),
        this.#loadEquippedCosmetics(),
      ]);


    return {
      username:
        profileResult.username,

      coins:
        walletResult.coins,

      inventory:
        inventoryResult,

      equippedCosmetics:
        equippedResult,
    };
  }

  async updateUsername(
    username,
  ) {
    const {
      data: userData,
      error: userError,
    } =
      await supabase.auth
        .getUser();


    if (userError) {
      throw userError;
    }


    const user =
      userData.user;


    if (!user) {
      throw new Error(
        'Kein angemeldeter Account vorhanden.',
      );
    }


    const {
      data,
      error,
    } =
      await supabase
        .from(
          'profiles',
        )
        .update({
          username,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          'user_id',
          user.id,
        )
        .select(
          'username',
        )
        .single();


    if (error) {
      if (
        error.code ===
        '23505'
      ) {
        throw new Error(
          'Dieser Nutzername ist bereits vergeben.',
        );
      }


      throw error;
    }


    return (
      data.username
    );
  }

  async #loadProfile() {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          'profiles',
        )
        .select(
          'username',
        )
        .maybeSingle();


    if (error) {
      throw error;
    }


    return {
      username:
        data?.username ??
        null,
    };
  }

  async #loadWallet() {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          'wallets',
        )
        .select(
          'coins',
        )
        .maybeSingle();


    if (error) {
      throw error;
    }


    return {
      coins:
        data?.coins ??
        0,
    };
  }


  async #loadInventory() {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          'user_inventory',
        )
        .select(
          `
            cosmetic_id,
            acquired_at
          `,
        )
        .order(
          'acquired_at',
          {
            ascending:
              true,
          },
        );


    if (error) {
      throw error;
    }


    return (
      data ??
      []
    );
  }


  async #loadEquippedCosmetics() {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          'equipped_cosmetics',
        )
        .select(
          `
            slot_key,
            cosmetic_id
          `,
        );


    if (error) {
      throw error;
    }


    const equipped =
      {};


    for (
      const item
      of data ?? []
    ) {
      equipped[
        item.slot_key
      ] =
        item.cosmetic_id;
    }


    return equipped;
  }
}