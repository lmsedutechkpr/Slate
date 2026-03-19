'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import GeneralSettingsForm from './GeneralSettingsForm';
import CommissionSettingsForm from './CommissionSettingsForm';
import NotificationSettingsForm from './NotificationSettingsForm';
import MaintenancePanel from './MaintenancePanel';

const LOCAL_KEY = 'slate_admin_settings_fallback';

export default function SettingsPageClient({
  initial,
  canPersistToDb,
}: {
  initial: any;
  canPersistToDb: boolean;
}) {
  const [settings, setSettings] = useState<any>(initial || {});

  const save = async (patch: Record<string, any>) => {
    const next = { ...settings, ...patch };
    setSettings(next);

    try {
      if (canPersistToDb) {
        const res = await fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        });
        if (!res.ok) throw new Error('DB save failed');
        toast.success('Settings saved');
      } else {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
        toast.success('Settings saved locally');
      }
    } catch {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      toast.success('Saved locally (fallback)');
    }
  };

  return (
    <div className="font-[DM_Sans]">
      <div className="mb-4">
        <h1 className="text-[26px] font-bold text-[#1D1D1F]">Settings</h1>
        <p className="mt-1 text-[13px] text-[#6E6E73]">Manage platform and system preferences</p>
      </div>

      <div className="grid gap-4">
        <GeneralSettingsForm
          initial={{
            siteName: settings.siteName || 'Slate LMS',
            supportEmail: settings.supportEmail || 'support@example.com',
            timezone: settings.timezone || 'Asia/Kolkata',
          }}
          onSave={(payload) => save(payload)}
        />

        <CommissionSettingsForm
          initial={{
            platformFeePercent: Number(settings.platformFeePercent || 10),
            taxRatePercent: Number(settings.taxRatePercent || 18),
          }}
          onSave={(payload) => save(payload)}
        />

        <NotificationSettingsForm
          initial={{
            emailNotifications: Boolean(settings.emailNotifications ?? true),
            purchaseAlerts: Boolean(settings.purchaseAlerts ?? true),
            payoutAlerts: Boolean(settings.payoutAlerts ?? true),
          }}
          onSave={(payload) => save(payload)}
        />

        <MaintenancePanel
          initial={{
            enabled: Boolean(settings.maintenanceMode),
            message: String(settings.maintenanceMessage || 'Maintenance mode is active.'),
          }}
          onSave={(payload) =>
            save({
              maintenanceMode: payload.enabled,
              maintenanceMessage: payload.message,
            })
          }
        />
      </div>
    </div>
  );
}
