'use client';

import { useMemo, useState } from 'react';
import { FileIcon } from '@/components/media';
import { useT } from '@/i18n/client';
import type { MessageKey } from '@/i18n/messages/en';
import type { ResourceDefinition } from '@/types/resource';

/**
 * The work terminal's file browser: every document the student may read, in
 * folders by kind, with the current step's files pinned in a folder of their
 * own. Picking a file hands it to the reader in the middle of the window, where
 * the open is logged like any other.
 */
export function ResourceLibrary({
  resources,
  highlightKeys,
  openKey,
  onOpen,
}: {
  resources: ResourceDefinition[];
  highlightKeys: string[];
  openKey: string | null;
  onOpen: (resource: ResourceDefinition) => void;
}) {
  const t = useT();
  const [query, setQuery] = useState('');
  const highlighted = useMemo(() => new Set(highlightKeys), [highlightKeys]);

  const folders = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (r: ResourceDefinition) =>
      !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    const sorted = resources.filter(match).sort((a, b) => a.sortOrder - b.sortOrder);
    const byType = new Map<string, ResourceDefinition[]>();
    for (const resource of sorted) {
      const list = byType.get(resource.resourceType) ?? [];
      list.push(resource);
      byType.set(resource.resourceType, list);
    }
    const groups: Array<{ key: string; label: string; items: ResourceDefinition[] }> = [];
    const forStep = sorted.filter((r) => highlighted.has(r.key));
    if (forStep.length) groups.push({ key: 'for-step', label: t('resources.forStep'), items: forStep });
    for (const [type, items] of byType) {
      groups.push({ key: type, label: t(`resources.type.${type}` as MessageKey), items });
    }
    return groups;
  }, [resources, query, highlighted, t]);

  const [openFolders, setOpenFolders] = useState<Set<string>>(() => new Set(['for-step']));
  const toggle = (key: string) =>
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="flex h-full flex-col" data-testid="resource-library">
      <div className="flex items-center gap-2 px-4 pb-3 pt-4">
        <svg aria-hidden viewBox="0 0 20 20" className="size-5 text-brand-600" fill="currentColor">
          <path d="M5 2h6l4 4v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm6 1.5V7h3.5L11 3.5ZM6.5 10h7v1.2h-7V10Zm0 3h7v1.2h-7V13Z" />
        </svg>
        <h3 className="text-sm font-bold text-strong">{t('work.library')}</h3>
      </div>
      <div className="px-3 pb-2">
        <label className="flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 focus-within:border-brand-400">
          <svg aria-hidden viewBox="0 0 20 20" className="size-3.5 text-subtle" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="9" cy="9" r="5.5" />
            <path d="m13.5 13.5 3.5 3.5" strokeLinecap="round" />
          </svg>
          <span className="sr-only">{t('work.searchFiles')}</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('work.searchFiles')}
            className="w-full bg-transparent text-xs text-strong outline-none placeholder:text-subtle"
          />
        </label>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {folders.length === 0 ? (
          <p className="px-3 py-4 text-[11px] text-muted">{t('resources.empty')}</p>
        ) : (
          folders.map((folder) => {
            const open = openFolders.has(folder.key) || query.trim() !== '';
            return (
              <div key={folder.key} className="mb-0.5">
                <button
                  type="button"
                  onClick={() => toggle(folder.key)}
                  aria-expanded={open}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors ${
                    folder.key === 'for-step'
                      ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                      : 'text-strong hover:bg-sunken'
                  }`}
                >
                  <FolderIcon open={open} />
                  <span className="min-w-0 flex-1 truncate">{folder.label}</span>
                  <span className="text-[10px] text-subtle">{folder.items.length}</span>
                </button>
                {open ? (
                  <ul className="ml-5 border-l border-line py-0.5 pl-2">
                    {folder.items.map((resource) => (
                      <li key={`${folder.key}:${resource.key}`}>
                        <button
                          type="button"
                          onClick={() => onOpen(resource)}
                          data-resource-key={resource.key}
                          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] transition-colors ${
                            openKey === resource.key
                              ? 'bg-brand-500 text-white'
                              : 'text-body hover:bg-sunken hover:text-strong'
                          }`}
                        >
                          <span className="shrink-0 scale-75">
                            <FileIcon format={resource.fileMeta?.format ?? 'DOC'} />
                          </span>
                          <span className="min-w-0 flex-1 truncate">{resource.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })
        )}
      </nav>
    </div>
  );
}

function FolderIcon({ open }: { open: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 24 20" className="h-4 w-5 shrink-0">
      <path d="M2 4a2 2 0 0 1 2-2h5l2 2.5h9a2 2 0 0 1 2 2V16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Z" fill="#e8a33d" />
      <path
        d={open ? 'M3.5 8h19l-2 10H2Z' : 'M2 7.5h20V16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z'}
        fill="#f7c35f"
      />
    </svg>
  );
}
