import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "./hooks/useAuth"
import { useSettings } from "./hooks/useSettings"
import { useSleepData } from "./hooks/useSleepData"
import { DataMigration } from "./components/DataMigration"
import "./SleepDiary.css"

interface DayData {
  dayOfWeek: string
  date: string
  bedTime: string
  sleepAttemptTime: string
  timeToFallAsleep: string
  nightAwakenings: string
  awakeningDuration: string
  finalAwakening: string
  outOfBed: string
  sleepQuality: string
  sweetIntake: string
  sweetTime: string
  caffeineIntake: string
  caffeineTime: string
  screenUse: string
  lastHourActivity: string[]
  stressLevel: string
  notes: string
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const ACTIVITY_OPTIONS = [
  "Reading",
  "Watching TV",
  "Using phone/tablet",
  "Exercise",
  "Meditation/Relaxation",
  "Work/Study",
  "Socializing",
  "Other",
]

// Get week number (ISO 8601)
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

// Get dates for a specific week (Monday to Sunday)
// weekOffset: 0 = current week, -1 = last week, 1 = next week
const getWeekDates = (weekOffset: number = 0): string[] => {
  const today = new Date()
  const currentDay = today.getDay()
  const diff = currentDay === 0 ? -6 : 1 - currentDay // Adjust to Monday

  const monday = new Date(today)
  monday.setDate(today.getDate() + diff + weekOffset * 7)

  return DAYS.map((_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return date.toISOString().split("T")[0]
  })
}

// Format date range for display (e.g., "Jan 8 - Jan 14")
const formatDateRange = (dates: string[]): string => {
  if (dates.length === 0 || !dates[0]) return ""

  const firstDate = new Date(dates[0])
  const lastDate = new Date(dates[dates.length - 1])

  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
  const firstFormatted = firstDate.toLocaleDateString("en-US", options)
  const lastFormatted = lastDate.toLocaleDateString("en-US", options)

  return `${firstFormatted} - ${lastFormatted}`
}

function SleepDiary() {
  // Auth and API hooks
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { settings, updateSettings } = useSettings()

  // Migration state
  const [showMigration, setShowMigration] = useState(true)
  const [migrationComplete, setMigrationComplete] = useState(false)

  // Local state for week navigation
  const [weekOffset, setWeekOffset] = useState(0) // 0 = current week, -1 = last week, 1 = next week

  // Calculate current week year and number
  const getCurrentWeekInfo = useCallback(() => {
    const today = new Date()
    const offsetDate = new Date(today)
    offsetDate.setDate(today.getDate() + weekOffset * 7)

    const year = offsetDate.getFullYear()
    const weekNumber = getWeekNumber(offsetDate)

    return { year, weekNumber }
  }, [weekOffset])

  const { year, weekNumber } = getCurrentWeekInfo()

  // Fetch sleep data for current week
  const { weekData: apiWeekData, loading, saving, saveWeekData } = useSleepData(year, weekNumber)

  // Local state derived from settings
  const [bedtime, setBedtime] = useState(settings.targetSchedule.bedTime)
  const [riseTime, setRiseTime] = useState(settings.targetSchedule.riseTime)
  const [darkMode, setDarkMode] = useState(settings.theme === "dark")
  const [viewMode, setViewMode] = useState<"week" | "day" | "analytics">(
    settings.viewMode as "week" | "day" | "analytics"
  )
  const [selectedDayIndex, setSelectedDayIndex] = useState(settings.selectedDay)

  // Local state for week data
  const [weekData, setWeekData] = useState<DayData[]>(() => {
    return DAYS.map((day) => ({
      dayOfWeek: day,
      date: "",
      bedTime: "",
      sleepAttemptTime: "",
      timeToFallAsleep: "",
      nightAwakenings: "",
      awakeningDuration: "",
      finalAwakening: "",
      outOfBed: "",
      sleepQuality: "",
      sweetIntake: "",
      sweetTime: "",
      caffeineIntake: "",
      caffeineTime: "",
      screenUse: "",
      lastHourActivity: [],
      stressLevel: "",
      notes: "",
    }))
  })

  // Sync local state with settings when they load
  useEffect(() => {
    setBedtime(settings.targetSchedule.bedTime)
    setRiseTime(settings.targetSchedule.riseTime)
    setDarkMode(settings.theme === "dark")
    setViewMode(settings.viewMode as "week" | "day" | "analytics")
    setSelectedDayIndex(settings.selectedDay)
  }, [settings])

  // Load API week data into local state
  useEffect(() => {
    if (apiWeekData && apiWeekData.length > 0) {
      setWeekData(apiWeekData)
    } else {
      // Initialize empty week with dates
      const weekDates = getWeekDates(weekOffset)
      setWeekData(
        DAYS.map((day, index) => ({
          dayOfWeek: day,
          date: weekDates[index],
          bedTime: "",
          sleepAttemptTime: "",
          timeToFallAsleep: "",
          nightAwakenings: "",
          awakeningDuration: "",
          finalAwakening: "",
          outOfBed: "",
          sleepQuality: "",
          sweetIntake: "",
          sweetTime: "",
          caffeineIntake: "",
          caffeineTime: "",
          screenUse: "",
          lastHourActivity: [],
          stressLevel: "",
          notes: "",
        }))
      )
    }
  }, [apiWeekData, weekOffset])

  // Auto-populate dates based on week offset
  useEffect(() => {
    const weekDates = getWeekDates(weekOffset)
    setWeekData((prevData) =>
      prevData.map((day, index) => ({
        ...day,
        date: weekDates[index],
      }))
    )
  }, [weekOffset])

  // Apply theme to document body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode")
    } else {
      document.body.classList.remove("dark-mode")
    }
  }, [darkMode])

  // Debounced auto-save for week data (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (weekData && weekData.length > 0 && weekData[0].date) {
        const weekStartDate = weekData[0].date
        saveWeekData(weekData, weekStartDate).catch((error) => {
          console.error("Failed to save week data:", error)
        })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [weekData, saveWeekData])

  // Update settings when they change
  useEffect(() => {
    const timer = setTimeout(() => {
      updateSettings({
        theme: darkMode ? "dark" : "light",
      }).catch((error) => {
        console.error("Failed to update theme:", error)
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [darkMode, updateSettings])

  useEffect(() => {
    const timer = setTimeout(() => {
      updateSettings({
        viewMode: viewMode,
      }).catch((error) => {
        console.error("Failed to update view mode:", error)
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [viewMode, updateSettings])

  useEffect(() => {
    const timer = setTimeout(() => {
      updateSettings({
        selectedDay: selectedDayIndex,
      }).catch((error) => {
        console.error("Failed to update selected day:", error)
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [selectedDayIndex, updateSettings])

  useEffect(() => {
    const timer = setTimeout(() => {
      updateSettings({
        targetSchedule: { bedTime: bedtime, riseTime: riseTime },
      }).catch((error) => {
        console.error("Failed to update target schedule:", error)
      })
    }, 500)

    return () => clearTimeout(timer)
  }, [bedtime, riseTime, updateSettings])

  // Get current day index (0 = Monday, 6 = Sunday)
  const getCurrentDayIndex = (): number => {
    const today = new Date()
    const dayNum = today.getDay()
    // Convert Sunday (0) to 6, and shift Monday-Saturday to 0-5
    return dayNum === 0 ? 6 : dayNum - 1
  }

  const updateDayData = (index: number, field: keyof DayData, value: string | string[]) => {
    const newData = [...weekData]
    newData[index] = { ...newData[index], [field]: value }
    setWeekData(newData)
  }

  const parseTime = (timeStr: string): number => {
    if (!timeStr) return 0
    const [hours, minutes] = timeStr.split(":").map(Number)
    return hours * 60 + minutes
  }

  const minutesToTime = (minutes: number): string => {
    const hrs = Math.floor(minutes / 60) % 24
    const mins = minutes % 60
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
  }

  const roundToNearest15 = (timeStr: string): string => {
    const totalMinutes = parseTime(timeStr)
    const rounded = Math.round(totalMinutes / 15) * 15
    return minutesToTime(rounded)
  }

  const getDefaultSleepTime = (): string => {
    const defaultTime = bedtime || "22:00"
    return roundToNearest15(defaultTime)
  }

  const getDefaultWakeTime = (): string => {
    const defaultTime = riseTime || "07:00"
    return roundToNearest15(defaultTime)
  }

  const parseDuration = (durStr: string): number => {
    if (!durStr) return 0
    const match = durStr.match(/(\d+\.?\d*)\s*(min|hour|hr)/i)
    if (!match) {
      // Check if it's just a number (minutes)
      const num = parseInt(durStr)
      return isNaN(num) ? 0 : num
    }
    const value = parseFloat(match[1])
    const unit = match[2].toLowerCase()
    return unit.startsWith("hour") || unit === "hr" ? value * 60 : value
  }

  const formatDuration = (minutes: number): string => {
    const hrs = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hrs}:${mins.toString().padStart(2, "0")}`
  }

  const calculateSleepMetrics = () => {
    const validEntries = weekData.filter(
      (day) => day.sleepAttemptTime && day.finalAwakening && day.timeToFallAsleep
    )

    if (validEntries.length === 0) {
      return { sleepWindow: "0:00", timeAwake: "0:00", timeAsleep: "0:00", efficiency: "0" }
    }

    let totalSleepWindow = 0
    let totalTimeAwake = 0

    validEntries.forEach((day) => {
      let sleepAttempt = parseTime(day.sleepAttemptTime)
      let wakeTime = parseTime(day.finalAwakening)

      if (wakeTime < sleepAttempt) {
        wakeTime += 24 * 60
      }

      const sleepWindow = wakeTime - sleepAttempt
      totalSleepWindow += sleepWindow

      const timeToSleep = parseDuration(day.timeToFallAsleep)
      const awakenings = parseDuration(day.awakeningDuration)
      totalTimeAwake += timeToSleep + awakenings
    })

    const avgSleepWindow = totalSleepWindow / validEntries.length
    const avgTimeAwake = totalTimeAwake / validEntries.length
    const avgTimeAsleep = avgSleepWindow - avgTimeAwake
    const efficiency = (avgTimeAsleep / avgSleepWindow) * 100

    return {
      sleepWindow: formatDuration(avgSleepWindow),
      timeAwake: formatDuration(avgTimeAwake),
      timeAsleep: formatDuration(avgTimeAsleep),
      efficiency: efficiency.toFixed(1),
    }
  }

  const getDayCompletion = (day: DayData): number => {
    const fields = [
      day.date,
      day.sleepAttemptTime,
      day.timeToFallAsleep,
      day.nightAwakenings,
      day.finalAwakening,
      day.sleepQuality,
      day.stressLevel,
    ]
    const completed = fields.filter((f) => f !== "").length
    return Math.round((completed / fields.length) * 100)
  }

  const getSleepQualityEmoji = (quality: string): string => {
    switch (quality) {
      case "Very poor":
        return "😴"
      case "Poor":
        return "😞"
      case "Fair":
        return "😐"
      case "Good":
        return "🙂"
      case "Very good":
        return "😊"
      default:
        return "⚪"
    }
  }

  const getSleepQualityScore = (quality: string): number => {
    switch (quality) {
      case "Very poor":
        return 1
      case "Poor":
        return 2
      case "Fair":
        return 3
      case "Good":
        return 4
      case "Very good":
        return 5
      default:
        return 0
    }
  }

  const calculateAnalytics = () => {
    const validDays = weekData.filter((day) => day.sleepQuality !== "")

    if (validDays.length === 0) {
      return {
        sweetCorrelation: null,
        caffeineCorrelation: null,
        screenCorrelation: null,
        stressCorrelation: null,
        totalDays: 0,
      }
    }

    // Calculate average sleep quality with and without each factor
    const withSweets = validDays.filter((d) => d.sweetIntake === "Yes")
    const withoutSweets = validDays.filter((d) => d.sweetIntake === "No")

    const withCaffeine = validDays.filter((d) => d.caffeineIntake === "Yes")
    const withoutCaffeine = validDays.filter((d) => d.caffeineIntake === "No")

    const withScreen = validDays.filter((d) => d.screenUse === "Yes")
    const withoutScreen = validDays.filter((d) => d.screenUse === "No")

    const highStress = validDays.filter(
      (d) => d.stressLevel === "High" || d.stressLevel === "Very high"
    )
    const lowStress = validDays.filter(
      (d) => d.stressLevel === "Low" || d.stressLevel === "Very low" || d.stressLevel === "Moderate"
    )

    const avgQuality = (days: DayData[]) => {
      if (days.length === 0) return 0
      const sum = days.reduce((acc, day) => acc + getSleepQualityScore(day.sleepQuality), 0)
      return sum / days.length
    }

    return {
      sweetCorrelation: {
        with: avgQuality(withSweets),
        without: avgQuality(withoutSweets),
        count: withSweets.length,
      },
      caffeineCorrelation: {
        with: avgQuality(withCaffeine),
        without: avgQuality(withoutCaffeine),
        count: withCaffeine.length,
      },
      screenCorrelation: {
        with: avgQuality(withScreen),
        without: avgQuality(withoutScreen),
        count: withScreen.length,
      },
      stressCorrelation: {
        high: avgQuality(highStress),
        low: avgQuality(lowStress),
        countHigh: highStress.length,
      },
      totalDays: validDays.length,
    }
  }

  const metrics = calculateSleepMetrics()
  const analytics = calculateAnalytics()

  if (loading) {
    return (
      <div className={`sleep-diary ${darkMode ? "dark-mode" : ""}`}>
        <div className="header">
          <h1 className="title">Loading...</h1>
        </div>
      </div>
    )
  }

  return (
    <>
      {showMigration && !migrationComplete && (
        <DataMigration
          onComplete={() => {
            setMigrationComplete(true)
            setShowMigration(false)
          }}
        />
      )}

      <div className={`sleep-diary ${darkMode ? "dark-mode" : ""}`}>
        <div className={`user-info-bar ${darkMode ? "dark-mode" : ""}`}>
          <div className="user-info-content">
            <span className="user-email">{user?.email}</span>
            {saving && <span className="saving-indicator">Saving...</span>}
          </div>
          <div className="user-actions">
            <button
              className="dark-mode-toggle"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button
              className="logout-button"
              onClick={async () => {
                await logout()
                navigate('/')
              }}
            >
              Logout
            </button>
          </div>
        </div>

      <div className="header">
        <div className="title-section">
          <h1 className="title">Sleep Diary</h1>
          <p className="subtitle">Track your sleep patterns and discover what affects your rest</p>
        </div>
        <div className="sleep-schedule">
          <div className="schedule-label">TARGET SCHEDULE</div>
          <div className="schedule-inputs">
            <div className="schedule-field">
              <label>Bedtime:</label>
              <input
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
              />
            </div>
            <div className="schedule-field">
              <label>Rise Time:</label>
              <input
                type="time"
                value={riseTime}
                onChange={(e) => setRiseTime(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="desktop-nav">
        <button
          className={`desktop-nav-btn ${viewMode === "week" ? "active" : ""}`}
          onClick={() => setViewMode("week")}
        >
          Week Overview
        </button>
        <button
          className={`desktop-nav-btn ${viewMode === "day" ? "active" : ""}`}
          onClick={() => {
            setSelectedDayIndex(getCurrentDayIndex())
            setViewMode("day")
          }}
        >
          Daily Entry
        </button>
        <button
          className={`desktop-nav-btn ${viewMode === "analytics" ? "active" : ""}`}
          onClick={() => setViewMode("analytics")}
        >
          Analytics
        </button>
      </div>

      {viewMode === "week" && (
        <div className="week-overview">
          <div className="week-header">
            <div className="week-navigation">
              <button
                className="week-nav-btn"
                onClick={() => setWeekOffset(weekOffset - 1)}
                title="Previous week"
              >
                ← Previous
              </button>
              <div className="week-info">
                <h2 className="week-title">
                  Week {weekData[0]?.date ? getWeekNumber(new Date(weekData[0].date)) : ""}
                </h2>
                <p className="week-date-range">{formatDateRange(weekData.map((d) => d.date))}</p>
              </div>
              <button
                className="week-nav-btn"
                onClick={() => setWeekOffset(weekOffset + 1)}
                title="Next week"
              >
                Next →
              </button>
            </div>
            {weekOffset !== 0 && (
              <button
                className="today-btn"
                onClick={() => setWeekOffset(0)}
              >
                ← Back to This Week
              </button>
            )}
          </div>
          <div className="week-grid">
            {weekData.map((day, index) => {
              const completion = getDayCompletion(day)
              const emoji = getSleepQualityEmoji(day.sleepQuality)

              return (
                <div
                  key={index}
                  className="day-card"
                  onClick={() => {
                    setSelectedDayIndex(index)
                    setViewMode("day")
                  }}
                >
                  <div className="day-card-header">
                    <span className="day-name">{day.dayOfWeek}</span>
                    <span className="sleep-emoji">{emoji}</span>
                  </div>

                  {day.date && <div className="day-date">{new Date(day.date).getDate()}</div>}

                  <div className="completion-bar">
                    <div
                      className="completion-fill"
                      style={{ width: `${completion}%` }}
                    />
                  </div>

                  <div className="day-stats">
                    {day.finalAwakening && <span className="stat">🛏️ {day.finalAwakening}</span>}
                    {day.stressLevel && (
                      <span className="stat-stress">
                        {day.stressLevel === "Very high" || day.stressLevel === "High" ? "⚠️" : "✓"}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {viewMode === "day" && (
        <div className="day-view">
          <div className="day-navigation">
            <button
              className="nav-btn"
              onClick={() => setSelectedDayIndex((selectedDayIndex - 1 + 7) % 7)}
            >
              ← Previous
            </button>
            <h2 className="current-day">{DAYS[selectedDayIndex]}</h2>
            <button
              className="nav-btn"
              onClick={() => setSelectedDayIndex((selectedDayIndex + 1) % 7)}
            >
              Next →
            </button>
          </div>

          <div className="day-form">
            {/* Sleep Times */}
            <div className="form-section">
              <h3 className="section-title">Sleep Times</h3>
              <div className="input-group">
                <label>
                  Lights out at
                  <span className="help-text">When you tried to fall asleep</span>
                </label>
                <div className="time-slider-container">
                  <span className="time-display">
                    {weekData[selectedDayIndex].sleepAttemptTime || getDefaultSleepTime()}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1439"
                    step="15"
                    value={(() => {
                      const time =
                        weekData[selectedDayIndex].sleepAttemptTime || getDefaultSleepTime()
                      let minutes = parseTime(time)
                      // Offset so slider starts at 12:00 (720 minutes)
                      // Slider position 0 = 12:00, position 719 = 11:45, position 720 = 12:00 next cycle
                      minutes = (minutes - 720 + 1440) % 1440
                      return minutes
                    })()}
                    onChange={(e) => {
                      // Convert slider position back to actual time
                      let sliderValue = parseInt(e.target.value)
                      let minutes = (sliderValue + 720) % 1440
                      const timeValue = minutesToTime(minutes)
                      updateDayData(selectedDayIndex, "sleepAttemptTime", timeValue)
                    }}
                    className="time-slider"
                  />
                </div>
              </div>
              <div className="input-group">
                <label>
                  Woke up at
                  <span className="help-text">Final wake time in the morning</span>
                </label>
                <div className="time-slider-container">
                  <span className="time-display">
                    {weekData[selectedDayIndex].finalAwakening || getDefaultWakeTime()}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1439"
                    step="15"
                    value={parseTime(
                      weekData[selectedDayIndex].finalAwakening || getDefaultWakeTime()
                    )}
                    onChange={(e) => {
                      const timeValue = minutesToTime(parseInt(e.target.value))
                      updateDayData(selectedDayIndex, "finalAwakening", timeValue)
                    }}
                    className="time-slider"
                  />
                </div>
              </div>
            </div>

            {/* Sleep Disruptions */}
            <div className="form-section">
              <h3 className="section-title">Sleep Disruptions</h3>
              <div className="input-group">
                <label>Time to fall asleep</label>
                <div className="button-group">
                  {["5 min", "15 min", "30 min", "45 min", "60+ min"].map((time) => (
                    <button
                      key={time}
                      type="button"
                      className={`choice-btn ${
                        weekData[selectedDayIndex].timeToFallAsleep === time ? "active" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        updateDayData(selectedDayIndex, "timeToFallAsleep", time)
                      }}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-grid">
                <div className="input-group">
                  <label>Night awakenings</label>
                  <select
                    value={weekData[selectedDayIndex].nightAwakenings}
                    onChange={(e) =>
                      updateDayData(selectedDayIndex, "nightAwakenings", e.target.value)
                    }
                    className="form-input"
                  >
                    <option value="">Select</option>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4+">4+</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Total time awake</label>
                  <select
                    value={weekData[selectedDayIndex].awakeningDuration}
                    onChange={(e) =>
                      updateDayData(selectedDayIndex, "awakeningDuration", e.target.value)
                    }
                    className="form-input"
                  >
                    <option value="">Select</option>
                    <option value="15 min">15 min</option>
                    <option value="30 min">30 min</option>
                    <option value="1 hour">1 hour</option>
                    <option value="2 hours">2+ hours</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Lifestyle Factors */}
            <div className="form-section">
              <h3 className="section-title">Lifestyle Factors</h3>
              <div className="toggle-grid">
                <div className="toggle-item">
                  <label>Sweets/Sugar (3hrs before bed)</label>
                  <div className="toggle-buttons">
                    <button
                      type="button"
                      className={`toggle-btn ${
                        weekData[selectedDayIndex].sweetIntake === "Yes" ? "active yes" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        updateDayData(selectedDayIndex, "sweetIntake", "Yes")
                      }}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${
                        weekData[selectedDayIndex].sweetIntake === "No" ? "active no" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        updateDayData(selectedDayIndex, "sweetIntake", "No")
                      }}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div className="toggle-item">
                  <label>Caffeine after 14:00</label>
                  <div className="toggle-buttons">
                    <button
                      type="button"
                      className={`toggle-btn ${
                        weekData[selectedDayIndex].caffeineIntake === "Yes" ? "active yes" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        updateDayData(selectedDayIndex, "caffeineIntake", "Yes")
                      }}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${
                        weekData[selectedDayIndex].caffeineIntake === "No" ? "active no" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        updateDayData(selectedDayIndex, "caffeineIntake", "No")
                      }}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div className="toggle-item">
                  <label>Screen time (2hrs before bed)</label>
                  <div className="toggle-buttons">
                    <button
                      type="button"
                      className={`toggle-btn ${
                        weekData[selectedDayIndex].screenUse === "Yes" ? "active yes" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        updateDayData(selectedDayIndex, "screenUse", "Yes")
                      }}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${
                        weekData[selectedDayIndex].screenUse === "No" ? "active no" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        updateDayData(selectedDayIndex, "screenUse", "No")
                      }}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Last hour activity before sleep (select all that apply)</label>
                <div className="button-group-wrap">
                  {ACTIVITY_OPTIONS.map((activity) => (
                    <button
                      key={activity}
                      type="button"
                      className={`choice-btn ${
                        weekData[selectedDayIndex].lastHourActivity.includes(activity) ? "active" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        const currentActivities = weekData[selectedDayIndex].lastHourActivity
                        const newActivities = currentActivities.includes(activity)
                          ? currentActivities.filter((a) => a !== activity)
                          : [...currentActivities, activity]
                        updateDayData(selectedDayIndex, "lastHourActivity", newActivities)
                      }}
                    >
                      {activity}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quality & Mood */}
            <div className="form-section">
              <h3 className="section-title">How Was It?</h3>
              <div className="input-group">
                <label>Stress Level</label>
                <div className="emoji-scale">
                  {[
                    { value: "Very low", emoji: "😌", label: "Very Low" },
                    { value: "Low", emoji: "🙂", label: "Low" },
                    { value: "Moderate", emoji: "😐", label: "Moderate" },
                    { value: "High", emoji: "😰", label: "High" },
                    { value: "Very high", emoji: "😫", label: "Very High" },
                  ].map(({ value, emoji, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={`emoji-btn ${
                        weekData[selectedDayIndex].stressLevel === value ? "active" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        updateDayData(selectedDayIndex, "stressLevel", value)
                      }}
                      title={label}
                    >
                      <span className="emoji">{emoji}</span>
                      <span className="emoji-label">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label>Sleep Quality</label>
                <div className="emoji-scale">
                  {[
                    { value: "Very poor", emoji: "😴", label: "Very Poor" },
                    { value: "Poor", emoji: "😞", label: "Poor" },
                    { value: "Fair", emoji: "😐", label: "Fair" },
                    { value: "Good", emoji: "🙂", label: "Good" },
                    { value: "Very good", emoji: "😊", label: "Very Good" },
                  ].map(({ value, emoji, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={`emoji-btn ${
                        weekData[selectedDayIndex].sleepQuality === value ? "active" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        updateDayData(selectedDayIndex, "sleepQuality", value)
                      }}
                      title={label}
                    >
                      <span className="emoji">{emoji}</span>
                      <span className="emoji-label">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label>Notes (optional)</label>
                <textarea
                  value={weekData[selectedDayIndex].notes}
                  onChange={(e) => updateDayData(selectedDayIndex, "notes", e.target.value)}
                  rows={3}
                  className="form-input"
                  placeholder="Anything that affected your sleep..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === "analytics" && (
        <div className="analytics-view">
          <h2 className="analytics-title">Sleep Insights</h2>
          <p className="analytics-subtitle">
            {analytics.totalDays > 0
              ? `Based on ${analytics.totalDays} days of data`
              : "Start tracking to see insights"}
          </p>

          {analytics.totalDays > 0 ? (
            <div className="insights-grid">
              {/* Sweet Intake */}
              {analytics.sweetCorrelation && analytics.sweetCorrelation.count > 0 && (
                <div className="insight-card">
                  <div className="insight-header">
                    <span className="insight-icon">🍬</span>
                    <h3>Sweet Intake Impact</h3>
                  </div>
                  <div className="insight-comparison">
                    <div className="comparison-item">
                      <span className="comparison-label">With sweets</span>
                      <div className="comparison-bar-container">
                        <div
                          className="comparison-bar"
                          style={{
                            width: `${(analytics.sweetCorrelation.with / 5) * 100}%`,
                            backgroundColor:
                              analytics.sweetCorrelation.with < analytics.sweetCorrelation.without
                                ? "#ef4444"
                                : "#10b981",
                          }}
                        />
                        <span className="comparison-value">
                          {analytics.sweetCorrelation.with.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                    <div className="comparison-item">
                      <span className="comparison-label">Without sweets</span>
                      <div className="comparison-bar-container">
                        <div
                          className="comparison-bar"
                          style={{
                            width: `${(analytics.sweetCorrelation.without / 5) * 100}%`,
                            backgroundColor:
                              analytics.sweetCorrelation.without > analytics.sweetCorrelation.with
                                ? "#10b981"
                                : "#94a3b8",
                          }}
                        />
                        <span className="comparison-value">
                          {analytics.sweetCorrelation.without.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="insight-conclusion">
                    {analytics.sweetCorrelation.with < analytics.sweetCorrelation.without
                      ? "⚠️ Sweets before bed may reduce sleep quality"
                      : analytics.sweetCorrelation.with > analytics.sweetCorrelation.without
                      ? "✓ No negative impact detected"
                      : "○ No clear pattern yet"}
                  </p>
                </div>
              )}

              {/* Caffeine */}
              {analytics.caffeineCorrelation && analytics.caffeineCorrelation.count > 0 && (
                <div className="insight-card">
                  <div className="insight-header">
                    <span className="insight-icon">☕</span>
                    <h3>Caffeine Impact</h3>
                  </div>
                  <div className="insight-comparison">
                    <div className="comparison-item">
                      <span className="comparison-label">With caffeine</span>
                      <div className="comparison-bar-container">
                        <div
                          className="comparison-bar"
                          style={{
                            width: `${(analytics.caffeineCorrelation.with / 5) * 100}%`,
                            backgroundColor:
                              analytics.caffeineCorrelation.with <
                              analytics.caffeineCorrelation.without
                                ? "#ef4444"
                                : "#10b981",
                          }}
                        />
                        <span className="comparison-value">
                          {analytics.caffeineCorrelation.with.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                    <div className="comparison-item">
                      <span className="comparison-label">Without caffeine</span>
                      <div className="comparison-bar-container">
                        <div
                          className="comparison-bar"
                          style={{
                            width: `${(analytics.caffeineCorrelation.without / 5) * 100}%`,
                            backgroundColor:
                              analytics.caffeineCorrelation.without >
                              analytics.caffeineCorrelation.with
                                ? "#10b981"
                                : "#94a3b8",
                          }}
                        />
                        <span className="comparison-value">
                          {analytics.caffeineCorrelation.without.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="insight-conclusion">
                    {analytics.caffeineCorrelation.with < analytics.caffeineCorrelation.without
                      ? "⚠️ Caffeine may be affecting your sleep"
                      : analytics.caffeineCorrelation.with > analytics.caffeineCorrelation.without
                      ? "✓ No negative impact detected"
                      : "○ No clear pattern yet"}
                  </p>
                </div>
              )}

              {/* Screen Time */}
              {analytics.screenCorrelation && analytics.screenCorrelation.count > 0 && (
                <div className="insight-card">
                  <div className="insight-header">
                    <span className="insight-icon">📱</span>
                    <h3>Screen Time Impact</h3>
                  </div>
                  <div className="insight-comparison">
                    <div className="comparison-item">
                      <span className="comparison-label">With screens</span>
                      <div className="comparison-bar-container">
                        <div
                          className="comparison-bar"
                          style={{
                            width: `${(analytics.screenCorrelation.with / 5) * 100}%`,
                            backgroundColor:
                              analytics.screenCorrelation.with < analytics.screenCorrelation.without
                                ? "#ef4444"
                                : "#10b981",
                          }}
                        />
                        <span className="comparison-value">
                          {analytics.screenCorrelation.with.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                    <div className="comparison-item">
                      <span className="comparison-label">Without screens</span>
                      <div className="comparison-bar-container">
                        <div
                          className="comparison-bar"
                          style={{
                            width: `${(analytics.screenCorrelation.without / 5) * 100}%`,
                            backgroundColor:
                              analytics.screenCorrelation.without > analytics.screenCorrelation.with
                                ? "#10b981"
                                : "#94a3b8",
                          }}
                        />
                        <span className="comparison-value">
                          {analytics.screenCorrelation.without.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="insight-conclusion">
                    {analytics.screenCorrelation.with < analytics.screenCorrelation.without
                      ? "⚠️ Screen time before bed may reduce sleep quality"
                      : analytics.screenCorrelation.with > analytics.screenCorrelation.without
                      ? "✓ No negative impact detected"
                      : "○ No clear pattern yet"}
                  </p>
                </div>
              )}

              {/* Stress */}
              {analytics.stressCorrelation && analytics.stressCorrelation.countHigh > 0 && (
                <div className="insight-card">
                  <div className="insight-header">
                    <span className="insight-icon">😰</span>
                    <h3>Stress Impact</h3>
                  </div>
                  <div className="insight-comparison">
                    <div className="comparison-item">
                      <span className="comparison-label">High stress days</span>
                      <div className="comparison-bar-container">
                        <div
                          className="comparison-bar"
                          style={{
                            width: `${(analytics.stressCorrelation.high / 5) * 100}%`,
                            backgroundColor: "#ef4444",
                          }}
                        />
                        <span className="comparison-value">
                          {analytics.stressCorrelation.high.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                    <div className="comparison-item">
                      <span className="comparison-label">Low stress days</span>
                      <div className="comparison-bar-container">
                        <div
                          className="comparison-bar"
                          style={{
                            width: `${(analytics.stressCorrelation.low / 5) * 100}%`,
                            backgroundColor: "#10b981",
                          }}
                        />
                        <span className="comparison-value">
                          {analytics.stressCorrelation.low.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="insight-conclusion">
                    {analytics.stressCorrelation.high < analytics.stressCorrelation.low
                      ? "⚠️ Stress is significantly affecting your sleep"
                      : "✓ Stress has minimal impact on sleep quality"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">📊</span>
              <p>Track at least one full day to see insights</p>
            </div>
          )}
        </div>
      )}

      <div className="footer">
        <div className="calculations-box">
          <div className="calc-icon">📊</div>
          <div className="calc-content">
            <h3>Weekly Analysis</h3>
            <p>Calculations based on completed days</p>
          </div>
        </div>

        <div className="sleep-numbers">
          <h3>SLEEP METRICS</h3>
        </div>

        <div className="metrics-grid">
          <div className="metric">
            <span className="metric-number">1</span>
            <div className="metric-info">
              <span className="metric-label">Sleep window</span>
              <span className="metric-value">{metrics.sleepWindow}</span>
            </div>
          </div>
          <div className="metric">
            <span className="metric-number">2</span>
            <div className="metric-info">
              <span className="metric-label">Time awake</span>
              <span className="metric-value">{metrics.timeAwake}</span>
            </div>
          </div>
          <div className="metric">
            <span className="metric-number">3</span>
            <div className="metric-info">
              <span className="metric-label">Time asleep</span>
              <span className="metric-value">{metrics.timeAsleep}</span>
            </div>
          </div>
          <div className="metric">
            <span className="metric-number">4</span>
            <div className="metric-info">
              <span className="metric-label">Efficiency</span>
              <span className="metric-value">{metrics.efficiency}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="copyright">© 2024 Sleep Diary - Track, analyze, and improve your sleep</div>
    </div>

    {/* Mobile Bottom Navigation */}
    <div className={`bottom-nav ${darkMode ? "dark-mode" : ""}`}>
      <button
        className={`bottom-nav-btn ${viewMode === "week" ? "active" : ""}`}
        onClick={() => setViewMode("week")}
      >
        Week
      </button>
      <button
        className={`bottom-nav-btn ${viewMode === "day" ? "active" : ""}`}
        onClick={() => {
          setSelectedDayIndex(getCurrentDayIndex())
          setViewMode("day")
        }}
      >
        Daily
      </button>
      <button
        className={`bottom-nav-btn ${viewMode === "analytics" ? "active" : ""}`}
        onClick={() => setViewMode("analytics")}
      >
        Analytics
      </button>
    </div>
    </>
  )
}

export default SleepDiary
