'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export interface AuthState {
  error?: string;
}

/**
 * Maps raw Supabase auth error messages to user-friendly copy.
 * Falls back to the original message for anything unrecognized.
 */
function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password.';
  }
  if (lower.includes('already registered') || lower.includes('user already exists')) {
    return 'This email is already registered.';
  }
  if (lower.includes('password') && (lower.includes('least') || lower.includes('weak') || lower.includes('short'))) {
    return 'Password is too weak (minimum 6 characters).';
  }

  return message;
}

export async function login(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof email !== 'string' || typeof password !== 'string') {
    return { error: 'Please fill in all fields.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  revalidatePath('/', 'layout');
  redirect('/series');
}

export async function logout(): Promise<AuthState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    // Do not redirect: the session may still be active, so the user is not
    // actually logged out.
    return { error: friendlyAuthError(error.message) };
  }

  revalidatePath('/', 'layout');
  redirect('/login');
}
