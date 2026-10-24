'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Field, inputClass } from '@/components/ui';
import { useT } from '@/i18n/client';

/** The display name, editable. The email is shown by the page, not edited here. */
export function ProfileForm({ initialDisplayName }: { initialDisplayName: string }) {
  const router = useRouter();
  const t = useT();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [saved, setSaved] = useState(initialDisplayName);
  const [status, setStatus] = useState<'idle' | 'pending' | 'saved' | 'failed'>('idle');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus('pending');
    try {
      const response = await fetch('/api/account/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ displayName }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setSaved(displayName.trim());
      setStatus('saved');
      // The header shows the name too.
      router.refresh();
    } catch {
      setStatus('failed');
    }
  }

  const unchanged = displayName.trim() === saved || displayName.trim() === '';

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field label={t('auth.displayName')} required>
        <input
          type="text"
          required
          maxLength={80}
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            setStatus('idle');
          }}
          className={inputClass}
          autoComplete="name"
          data-testid="display-name"
        />
      </Field>
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          size="sm"
          loading={status === 'pending'}
          disabled={unchanged}
          data-testid="save-profile"
        >
          {status === 'pending' ? t('mypage.profile.saving') : t('mypage.profile.save')}
        </Button>
        {status === 'saved' ? (
          <p className="text-xs text-accent-700" data-testid="profile-status">
            {t('mypage.profile.saved')}
          </p>
        ) : null}
        {status === 'failed' ? (
          <p className="text-xs text-danger-400" data-testid="profile-status">
            {t('mypage.profile.failed')}
          </p>
        ) : null}
      </div>
    </form>
  );
}
