import { useState, useEffect, useCallback } from 'react';
import { settingsService } from '../services/settings.service';
import { UserSettings } from '../types/api.types';
import toast from 'react-hot-toast';

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>({
    targetSchedule: { bedTime: '', riseTime: '' },
    theme: 'light',
    viewMode: 'week',
    selectedDay: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (err: any) {
      const message = err.response?.data?.error?.message || err.message || 'Failed to load settings';
      setError(message);
      // Don't show toast for settings load errors, use defaults
      console.error('Failed to load settings:', message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    try {
      setUpdating(true);

      const updated = await settingsService.updateSettings(newSettings);
      setSettings(updated);
    } catch (err: any) {
      const message = err.response?.data?.error?.message || err.message || 'Failed to update settings';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updating,
    updateSettings,
    refetch: fetchSettings,
  };
}
