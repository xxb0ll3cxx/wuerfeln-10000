import {
  supabase,
} from '../lib/supabaseClient.js';


export class AccountService {
  async loadAccountData() {
    const [
      walletResult,
      inventoryResult,
      equippedResult,
    ] =
      await Promise.all([
        this.#loadWallet(),
        this.#loadInventory(),
        this.#loadEquippedCosmetics(),
      ]);


    return {
      coins:
        walletResult.coins,

      inventory:
        inventoryResult,

      equippedCosmetics:
        equippedResult,
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