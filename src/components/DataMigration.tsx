import { useState, useEffect } from 'react';
import { sleepService } from '../services/sleep.service';
import { settingsService } from '../services/settings.service';
import toast from 'react-hot-toast';

// Get week number (ISO 8601)
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

interface DataMigrationProps {
  onComplete: () => void;
}

export function DataMigration({ onComplete }: DataMigrationProps) {
  const [hasData, setHasData] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if there's localStorage data to migrate
    const weekData = localStorage.getItem('sleepDiaryWeekData');
    const bedtime = localStorage.getItem('sleepDiaryBedtime');
    const riseTime = localStorage.getItem('sleepDiaryRiseTime');
    const theme = localStorage.getItem('sleepDiaryTheme');

    setHasData(!!(weekData || bedtime || riseTime || theme));
  }, []);

  async function handleMigrate() {
    setMigrating(true);
    setProgress(0);

    try {
      let totalSteps = 0;
      let completedSteps = 0;

      // Count steps
      if (localStorage.getItem('sleepDiaryWeekData')) totalSteps++;
      if (
        localStorage.getItem('sleepDiaryBedtime') ||
        localStorage.getItem('sleepDiaryRiseTime') ||
        localStorage.getItem('sleepDiaryTheme') ||
        localStorage.getItem('sleepDiaryViewMode') ||
        localStorage.getItem('sleepDiarySelectedDay')
      ) {
        totalSteps++;
      }

      // Migrate settings
      const settingsData: any = {};
      const bedtime = localStorage.getItem('sleepDiaryBedtime');
      const riseTime = localStorage.getItem('sleepDiaryRiseTime');
      const theme = localStorage.getItem('sleepDiaryTheme');
      const viewMode = localStorage.getItem('sleepDiaryViewMode');
      const selectedDay = localStorage.getItem('sleepDiarySelectedDay');

      if (bedtime || riseTime || theme || viewMode || selectedDay) {
        settingsData.targetSchedule = {
          bedTime: bedtime || '',
          riseTime: riseTime || '',
        };
        settingsData.theme = theme || 'light';
        settingsData.viewMode = viewMode || 'week';
        settingsData.selectedDay = selectedDay ? parseInt(selectedDay) : 0;

        await settingsService.updateSettings(settingsData);
        completedSteps++;
        setProgress((completedSteps / totalSteps) * 100);
      }

      // Migrate week data
      const weekDataStr = localStorage.getItem('sleepDiaryWeekData');
      if (weekDataStr) {
        try {
          const weekData = JSON.parse(weekDataStr);

          if (weekData && Array.isArray(weekData) && weekData.length > 0 && weekData[0].date) {
            // Calculate week from first date
            const firstDate = new Date(weekData[0].date);
            const year = firstDate.getFullYear();
            const weekNumber = getWeekNumber(firstDate);
            const weekStartDate = weekData[0].date;

            await sleepService.saveWeek({
              year,
              weekNumber,
              weekStartDate,
              weekData,
            });
          }

          completedSteps++;
          setProgress((completedSteps / totalSteps) * 100);
        } catch (error) {
          console.error('Failed to migrate week data:', error);
        }
      }

      // Clear localStorage after successful migration
      localStorage.removeItem('sleepDiaryWeekData');
      localStorage.removeItem('sleepDiaryBedtime');
      localStorage.removeItem('sleepDiaryRiseTime');
      localStorage.removeItem('sleepDiaryTheme');
      localStorage.removeItem('sleepDiaryViewMode');
      localStorage.removeItem('sleepDiarySelectedDay');

      toast.success('Data migrated successfully!');
      onComplete();
    } catch (error: any) {
      console.error('Migration error:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to migrate data');
      setMigrating(false);
    }
  }

  function handleSkip() {
    // Clear localStorage without migrating
    localStorage.removeItem('sleepDiaryWeekData');
    localStorage.removeItem('sleepDiaryBedtime');
    localStorage.removeItem('sleepDiaryRiseTime');
    localStorage.removeItem('sleepDiaryTheme');
    localStorage.removeItem('sleepDiaryViewMode');
    localStorage.removeItem('sleepDiarySelectedDay');

    onComplete();
  }

  if (!hasData) {
    onComplete();
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '32px',
          borderRadius: '8px',
          maxWidth: '500px',
          width: '90%',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '16px' }}>Import Your Sleep Data?</h2>

        <p style={{ marginBottom: '24px', color: '#666' }}>
          We found existing sleep data on this device. Would you like to import it to your account?
        </p>

        {migrating && (
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                width: '100%',
                height: '8px',
                background: '#eee',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: '#4CAF50',
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '14px', color: '#666' }}>
              Migrating data... {Math.round(progress)}%
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSkip}
            disabled={migrating}
            style={{
              padding: '10px 20px',
              background: '#ddd',
              border: 'none',
              borderRadius: '4px',
              cursor: migrating ? 'not-allowed' : 'pointer',
              opacity: migrating ? 0.5 : 1,
            }}
          >
            Start Fresh
          </button>
          <button
            onClick={handleMigrate}
            disabled={migrating}
            style={{
              padding: '10px 20px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: migrating ? 'not-allowed' : 'pointer',
              opacity: migrating ? 0.5 : 1,
            }}
          >
            {migrating ? 'Importing...' : 'Import Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
