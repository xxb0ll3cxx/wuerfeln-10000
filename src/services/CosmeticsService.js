import {
  supabase,
} from '../lib/supabaseClient.js';


export class CosmeticsService {
  async equipCharacterSkin(
    cosmeticId,
  ) {
    const {
      error,
    } = await supabase.rpc(
      'equip_character_skin',
      {
        p_cosmetic_id:
          cosmeticId,
      },
    );


    if (error) {
      throw error;
    }
  }

  async unequipCharacterSkin(
  cosmeticId,
  slotKey,
) {
  const {
    error,
  } = await supabase.rpc(
    'unequip_character_skin',
    {
      p_cosmetic_id:
        cosmeticId,

      p_slot_key:
        slotKey,
    },
  );

  if (error) {
    throw error;
  }
}

async equipDiceSkin(cosmeticId) {
  const { error } =
    await supabase.rpc(
      'equip_dice_skin',
      {
        p_cosmetic_id:
          cosmeticId,
      },
    );

  if (error) {
    throw error;
  }
}

async unequipDiceSkin(cosmeticId) {
  const { error } =
    await supabase.rpc(
      'unequip_dice_skin',
      {
        p_cosmetic_id:
          cosmeticId,
      },
    );

  if (error) {
    throw error;
  }
}
}