'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signup } from '@/actions/auth';
import { Input } from '@/components/ui/input';

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signup, {});

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-[34px] font-bold text-text-primary">Sign up</h1>

      <form action={formAction} className="flex flex-col gap-4">
        <Input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="Email"
        />
        <Input
          type="password"
          name="password"
          required
          autoComplete="new-password"
          placeholder="Password"
        />
        <Input
          type="password"
          name="confirmPassword"
          required
          autoComplete="new-password"
          placeholder="Confirm password"
        />

        {state.error && <p className="text-[15px] text-accent-red">{state.error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="min-h-11 w-full rounded-md bg-accent text-[17px] font-semibold text-white disabled:opacity-50"
        >
          {isPending ? 'Signing up…' : 'Sign up'}
        </button>
      </form>

      <p className="text-center text-[15px] text-text-secondary">
        Already have an account?{' '}
        <Link href="/login" className="text-accent">
          Log in
        </Link>
      </p>
    </div>
  );
}
