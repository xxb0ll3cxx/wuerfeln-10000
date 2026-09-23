import {
  supabase,
} from '../lib/supabaseClient.js';

import {
  CHARACTER_SKINS,
} from '../config/characterSkins.js';
import {
  DICE_SKINS,
} from '../config/diceSkins.js';

export class ShopService {
  async loadCosmetics() {
    const cosmeticIds = [
      ...Object.keys(CHARACTER_SKINS),
      ...Object.keys(DICE_SKINS),
    ];


    if (
      cosmeticIds.length === 0
    ) {
      return [];
    }


    const {
      data,
      error,
    } =
      await supabase
        .from(
          'cosmetics',
        )
        .select(
          'id, name, price',
        )
        .eq(
          'active',
          true,
        )
        .in(
          'id',
          cosmeticIds,
        )
        .order(
          'name',
          {
            ascending: true,
          },
        );


    if (
      error
    ) {
      throw error;
    }


    return data ?? [];
  }

    async purchaseCosmetic(
    cosmeticId,
    ) {
    const {
        data,
        error,
    } =
        await supabase.rpc(
        'purchase_cosmetic',
        {
            p_cosmetic_id:
            cosmeticId,
        },
        );


    if (
        error
    ) {
        throw error;
    }


    /*
    * Die Datenbankfunktion gibt den
    * verbleibenden Coinstand zurück.
    */
    return data;
    }
}