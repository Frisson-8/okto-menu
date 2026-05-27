import type { SettingsRow } from '@/lib/supabase/types';

type Props = { settings: SettingsRow | null };

export function MenuFooter({ settings }: Props) {
  if (!settings) return null;

  const lines: Array<{ label: string; value: string }> = [];
  if (settings.wifi_password) lines.push({ label: 'WiFi', value: settings.wifi_password });
  if (settings.instagram) lines.push({ label: 'Instagram', value: settings.instagram });
  if (settings.address) lines.push({ label: 'Adresa', value: settings.address });
  if (settings.phone) lines.push({ label: 'Telefon', value: settings.phone });
  if (settings.email) lines.push({ label: 'Email', value: settings.email });
  if (settings.website) lines.push({ label: 'Web', value: settings.website });

  return (
    <footer className="mt-16 border-t border-white/10 px-5 py-8 text-sm">
      {settings.footer_note && (
        <p className="mb-6 text-accent font-medium tracking-wide">
          {settings.footer_note}
        </p>
      )}
      {lines.length > 0 && (
        <dl className="space-y-1.5 text-muted">
          {lines.map((l) => (
            <div key={l.label} className="flex gap-3">
              <dt className="w-20 shrink-0 uppercase text-[11px] tracking-widish pt-[3px]">
                {l.label}
              </dt>
              <dd className="text-white/90">{l.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="mt-8 text-[11px] uppercase tracking-widest text-muted/70">
        {settings.pub_name} · cene u {settings.currency}
      </p>
    </footer>
  );
}
