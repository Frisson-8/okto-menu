'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { session, loading, signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If a session already exists when the page mounts, skip straight to /admin.
  useEffect(() => {
    if (!loading && session) {
      router.replace('/admin');
    }
  }, [loading, session, router]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signIn(email.trim(), password);
    if (signInError) {
      setError(signInError.message);
      setSubmitting(false);
      return;
    }
    // Don't drop the submitting flag — we're navigating away.
    router.replace('/admin');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const canSubmit = email.length > 0 && password.length > 0 && !submitting;

  return (
    <main className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <header className="mb-10">
          <h1 className="font-display font-extrabold uppercase tracking-widish text-4xl leading-none">
            OKTO<span className="text-accent">.</span>
          </h1>
          <p className="mt-2 text-xs uppercase tracking-widest text-muted">
            Admin · Prijava
          </p>
          <span aria-hidden="true" className="mt-4 block h-px w-10 bg-accent" />
        </header>

        <div className="space-y-4">
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            onKeyDown={handleKeyDown}
            autoComplete="email"
            disabled={submitting}
          />
          <Field
            label="Lozinka"
            type="password"
            value={password}
            onChange={setPassword}
            onKeyDown={handleKeyDown}
            autoComplete="current-password"
            disabled={submitting}
          />

          {error && (
            <p
              role="alert"
              className="text-[13px] text-accent tracking-wide"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            className="mt-2 w-full bg-accent text-bg uppercase tracking-widish font-display font-bold text-sm py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition"
          >
            {submitting ? 'Prijavljujem...' : 'Prijavi se'}
          </button>
        </div>

        <p className="mt-10 text-[11px] uppercase tracking-widest text-muted/70 text-center">
          Pristup samo za vlasnika
        </p>
      </div>
    </main>
  );
}

type FieldProps = {
  label: string;
  type: 'email' | 'password';
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  disabled?: boolean;
};

function Field({ label, type, value, onChange, onKeyDown, autoComplete, disabled }: FieldProps) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-widish text-muted mb-1.5">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        autoComplete={autoComplete}
        disabled={disabled}
        className="w-full bg-surface text-white px-3 py-2.5 border border-white/10 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent placeholder-muted/60 disabled:opacity-60"
      />
    </label>
  );
}
