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
}