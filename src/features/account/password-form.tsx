'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Field, inputClass } from '@/components/ui';
import { useT } from '@/i18n/client';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/lib/auth/password-rules';

/**
 * Sets a first password, or changes the existing one. Changing asks for the
 * current password, so a browser left signed in cannot be used to lock the
 * owner out.
 */
export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter();
  const t = useT();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(
    null,
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (next.length < PASSWORD_MIN_LENGTH) {
      setMessage({ tone: 'error', text: t('auth.passwordTooShort', { min: PASSWORD_MIN_LENGTH }) });
      return;
    }
    if (next !== confirm) {
      setMessage({ tone: 'error', text: t('auth.passwordMismatch') });
      return;
    }
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          currentPassword: hasPassword ? current : undefined,
          newPassword: next,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({
          tone: 'error',
          text:
            data.code === 'wrong_password'
              ? t('mypage.password.wrongCurrent')
              : data.code === 'setup_required'
                ? data.error
                : t('mypage.password.failed'),
        });
        setPending(false);
        return;
      }
      setMessage({
        tone: 'ok',
        text: hasPassword ? t('mypage.password.savedChange') : t('mypage.password.savedSet'),
      });
      setCurrent('');
      setNext('');
      setConfirm('');
      setPending(false);
      router.refresh();
    } catch {
      setMessage({ tone: 'error', text: t('mypage.password.failed') });
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" data-testid="password-form">
      {hasPassword ? (
        <Field label={t('mypage.password.current')} required>
          <input
            type="password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={inputClass}
            autoComplete="current-password"
            data-testid="current-password"
          />
        </Field>
      ) : null}
      <Field
        label={t('mypage.password.new')}
        helpText={t('auth.passwordHint', { min: PASSWORD_MIN_LENGTH })}
        required
      >
        <input
          type="password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className={inputClass}
          autoComplete="new-password"
          data-testid="new-password"
        />
      </Field>
      <Field label={t('mypage.password.confirm')} required>
        <input
          type="password"
          required
          maxLength={PASSWORD_MAX_LENGTH}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
          autoComplete="new-password"
          data-testid="new-password-confirm"
        />
      </Field>

      {message ? (
        <p
          data-testid="password-status"
          className={
            message.tone === 'ok'
              ? 'rounded-lg border border-accent-100 bg-accent-50 px-3 py-2 text-xs text-accent-700'
              : 'rounded-lg border border-danger-400/30 bg-danger-400/10 px-3 py-2 text-xs text-danger-400'
          }
        >
          {message.text}
        </p>
      ) : null}

      <Button type="submit" size="sm" loading={pending} data-testid="save-password">
        {pending
          ? t('mypage.password.pending')
          : hasPassword
            ? t('mypage.password.submitChange')
            : t('mypage.password.submitSet')}
      </Button>
    </form>
  );
}
