import { useState, useEffect, useCallback } from 'react';
import { sleepService } from '../services/sleep.service';
import { WeekData, DayData } from '../types/api.types';
import toast from 'react-hot-toast';

export function useSleepData(year: number, weekNumber: number) {
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch week data
  const fetchWeekData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await sleepService.getWeek(year, weekNumber);

      if (data.weekData && data.weekData.length > 0) {
        setWeekData(data.weekData);
      } else {
        // Initialize empty week data
        setWeekData([]);
      }
    } catch (err: any) {
      const message = err.response?.data?.error?.message || err.message || 'Failed to load week data';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [year, weekNumber]);

  // Save week data
  const saveWeekData = useCallback(
    async (data: DayData[], weekStartDate: string) => {
      try {
        setSaving(true);

        const weekDataPayload: WeekData = {
          year,
          weekNumber,
          weekStartDate,
          weekData: data,
        };

        await sleepService.saveWeek(weekDataPayload);
        setWeekData(data);
      } catch (err: any) {
        const message = err.response?.data?.error?.message || err.message || 'Failed to save week data';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [year, weekNumber]
  );

  // Load data when year or week changes
  useEffect(() => {
    fetchWeekData();
  }, [fetchWeekData]);

  return {
    weekData,
    loading,
    error,
    saving,
    saveWeekData,
    refetch: fetchWeekData,
  };
}
