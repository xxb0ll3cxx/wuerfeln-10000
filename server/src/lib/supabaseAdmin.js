import 'dotenv/config';

import {
  createClient,
} from '@supabase/supabase-js';


const supabaseUrl =
  process.env
    .SUPABASE_URL
    ?.trim();


const supabaseSecretKey =
  process.env
    .SUPABASE_SECRET_KEY
    ?.trim();


if (
  !supabaseUrl ||
  !supabaseSecretKey
) {
  console.error(
    '[Supabase] Fehlende Server-Konfiguration:',
    {
      hasUrl:
        Boolean(
          supabaseUrl,
        ),

      hasSecretKey:
        Boolean(
          supabaseSecretKey,
        ),
    },
  );


  throw new Error(
    'Supabase-Serverkonfiguration fehlt.',
  );
}


export const supabaseAdmin =
  createClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false,

        detectSessionInUrl:
          false,
      },
    },
  );