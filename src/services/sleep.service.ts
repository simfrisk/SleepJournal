import api from './api';
import { WeekData, ApiResponse } from '../types/api.types';

export const sleepService = {
  async getWeek(year: number, week: number): Promise<WeekData> {
    const response = await api.get<ApiResponse<WeekData>>(
      `/sleep-get-week?year=${year}&week=${week}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error('Failed to fetch week data');
  },

  async saveWeek(weekData: WeekData): Promise<void> {
    const response = await api.post<ApiResponse>('/sleep-save-week', weekData);

    if (!response.data.success) {
      throw new Error('Failed to save week data');
    }
  },

  async getAllWeeks(year?: number): Promise<WeekData[]> {
    const url = year ? `/sleep-get-all-weeks?year=${year}` : '/sleep-get-all-weeks';
    const response = await api.get<ApiResponse<{ weeks: WeekData[] }>>(url);

    if (response.data.success && response.data.weeks) {
      return response.data.weeks;
    }

    throw new Error('Failed to fetch all weeks');
  },
};
