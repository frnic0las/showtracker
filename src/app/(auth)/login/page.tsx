'use client';

import { useActionState } from 'react';
import { login } from '@/actions/auth';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, {});

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-[34px] font-bold text-text-primary">Log in</h1>

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
          autoComplete="current-password"
          placeholder="Password"
        />

        {state.error && <p className="text-[15px] text-accent-red">{state.error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="min-h-11 w-full rounded-md bg-accent text-[17px] font-semibold text-white disabled:opacity-50"
        >
          {isPending ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}
