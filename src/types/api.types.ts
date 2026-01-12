export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  [key: string]: any;
}

export interface DayData {
  dayOfWeek: string;
  date: string;
  bedTime: string;
  sleepAttemptTime: string;
  timeToFallAsleep: string;
  nightAwakenings: string;
  awakeningDuration: string;
  finalAwakening: string;
  outOfBed: string;
  sleepQuality: string;
  sweetIntake: string;
  sweetTime: string;
  caffeineIntake: string;
  caffeineTime: string;
  screenUse: string;
  lastHourActivity: string[];
  stressLevel: string;
  notes: string;
}

export interface WeekData {
  year: number;
  weekNumber: number;
  weekStartDate: string;
  weekData: DayData[];
}

export interface UserSettings {
  targetSchedule: {
    bedTime: string;
    riseTime: string;
  };
  theme: string;
  viewMode: string;
  selectedDay: number;
}
