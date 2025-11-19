import { supabase } from '../lib/supabase';
import { AuthUser } from '@/types';
import { Session, AuthError } from '@supabase/supabase-js';

export interface UserMetadata {
  name?: string;
  [key: string]: unknown;
}

export class AuthService {
  static async signUp(email: string, password: string, userData: UserMetadata) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${window.location.origin}/auth/confirmado`,
      },
    });
    return { data, error };
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  static async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  static async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  }

  static async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  }

  static async getCurrentUser(): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return { user: null, error };
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata as { name?: string },
    };

    return { user: authUser, error };
  }

  static onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}
