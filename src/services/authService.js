import {
  supabase,
} from '../lib/supabaseClient.js';


export class AuthService {
  async signUp(
    email,
    password,
  ) {
    const {
      data,
      error,
    } =
      await supabase.auth.signUp({
        email,
        password,
      });


    if (error) {
      throw error;
    }


    return {
      user:
        data.user ?? null,

      session:
        data.session ?? null,
    };
  }


  async signIn(
    email,
    password,
  ) {
    const {
      data,
      error,
    } =
      await supabase.auth
        .signInWithPassword({
          email,
          password,
        });


    if (error) {
      throw error;
    }


    return {
      user:
        data.user ?? null,

      session:
        data.session ?? null,
    };
  }


  async signOut() {
    const {
      error,
    } =
      await supabase.auth.signOut({
        scope:
          'local',
      });


    if (error) {
      throw error;
    }
  }


  async getCurrentUser() {
    const {
      data,
      error,
    } =
      await supabase.auth.getUser();


    if (error) {
      throw error;
    }


    return (
      data.user ??
      null
    );
  }


  onAuthStateChange(
    callback,
  ) {
    const {
      data,
    } =
      supabase.auth
        .onAuthStateChange(
          (
            event,
            session,
          ) => {
            callback({
              event,

              user:
                session?.user ??
                null,

              session:
                session ??
                null,
            });
          },
        );


    return () => {
      data.subscription
        .unsubscribe();
    };
  }
}