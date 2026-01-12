import api from './api';
import { UserSettings, ApiResponse } from '../types/api.types';

export const settingsService = {
  async getSettings(): Promise<UserSettings> {
    const response = await api.get<ApiResponse<{ settings: UserSettings }>>(
      '/user-settings-get'
    );

    if (response.data.success && response.data.settings) {
      return response.data.settings;
    }

    throw new Error('Failed to fetch settings');
  },

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const response = await api.put<ApiResponse<{ settings: UserSettings }>>(
      '/user-settings-update',
      settings
    );

    if (response.data.success && response.data.settings) {
      return response.data.settings;
    }

    throw new Error('Failed to update settings');
  },
};
