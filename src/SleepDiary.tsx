import { useState } from 'react'
import './SleepDiary.css'

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
  lastHourActivity: string
  stressLevel: string
  notes: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const ACTIVITY_OPTIONS = [
  'Reading',
  'Watching TV',
  'Using phone/tablet',
  'Exercise',
  'Meditation/Relaxation',
  'Work/Study',
  'Socializing',
  'Other'
]

function SleepDiary() {
  const [bedtime, setBedtime] = useState('')
  const [riseTime, setRiseTime] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'analytics'>('week')
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)

  const [weekData, setWeekData] = useState<DayData[]>(
    DAYS.map(day => ({
      dayOfWeek: day,
      date: '',
      bedTime: '',
      sleepAttemptTime: '',
      timeToFallAsleep: '',
      nightAwakenings: '',
      awakeningDuration: '',
      finalAwakening: '',
      outOfBed: '',
      sleepQuality: '',
      sweetIntake: '',
      sweetTime: '',
      caffeineIntake: '',
      caffeineTime: '',
      screenUse: '',
      lastHourActivity: '',
      stressLevel: '',
      notes: ''
    }))
  )

  const updateDayData = (index: number, field: keyof DayData, value: string) => {
    const newData = [...weekData]
    newData[index] = { ...newData[index], [field]: value }
    setWeekData(newData)
  }

  const parseTime = (timeStr: string): number => {
    if (!timeStr) return 0
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
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
    return unit.startsWith('hour') || unit === 'hr' ? value * 60 : value
  }

  const formatDuration = (minutes: number): string => {
    const hrs = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hrs}:${mins.toString().padStart(2, '0')}`
  }

  const calculateSleepMetrics = () => {
    const validEntries = weekData.filter(day =>
      day.sleepAttemptTime && day.outOfBed && day.timeToFallAsleep
    )

    if (validEntries.length === 0) {
      return { sleepWindow: '0:00', timeAwake: '0:00', timeAsleep: '0:00', efficiency: '0' }
    }

    let totalSleepWindow = 0
    let totalTimeAwake = 0

    validEntries.forEach(day => {
      let sleepAttempt = parseTime(day.sleepAttemptTime)
      let outOfBed = parseTime(day.outOfBed)

      if (outOfBed < sleepAttempt) {
        outOfBed += 24 * 60
      }

      const sleepWindow = outOfBed - sleepAttempt
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
      efficiency: efficiency.toFixed(1)
    }
  }

  const getDayCompletion = (day: DayData): number => {
    const fields = [
      day.date, day.bedTime, day.sleepAttemptTime, day.timeToFallAsleep,
      day.nightAwakenings, day.outOfBed, day.sleepQuality, day.stressLevel
    ]
    const completed = fields.filter(f => f !== '').length
    return Math.round((completed / fields.length) * 100)
  }

  const getSleepQualityEmoji = (quality: string): string => {
    switch (quality) {
      case 'Very poor': return '😴'
      case 'Poor': return '😞'
      case 'Fair': return '😐'
      case 'Good': return '🙂'
      case 'Very good': return '😊'
      default: return '⚪'
    }
  }

  const getSleepQualityScore = (quality: string): number => {
    switch (quality) {
      case 'Very poor': return 1
      case 'Poor': return 2
      case 'Fair': return 3
      case 'Good': return 4
      case 'Very good': return 5
      default: return 0
    }
  }

  const calculateAnalytics = () => {
    const validDays = weekData.filter(day => day.sleepQuality !== '')

    if (validDays.length === 0) {
      return {
        sweetCorrelation: null,
        caffeineCorrelation: null,
        screenCorrelation: null,
        stressCorrelation: null,
        totalDays: 0
      }
    }

    // Calculate average sleep quality with and without each factor
    const withSweets = validDays.filter(d => d.sweetIntake === 'Yes')
    const withoutSweets = validDays.filter(d => d.sweetIntake === 'No')

    const withCaffeine = validDays.filter(d => d.caffeineIntake === 'Yes')
    const withoutCaffeine = validDays.filter(d => d.caffeineIntake === 'No')

    const withScreen = validDays.filter(d => d.screenUse === 'Yes')
    const withoutScreen = validDays.filter(d => d.screenUse === 'No')

    const highStress = validDays.filter(d => d.stressLevel === 'High' || d.stressLevel === 'Very high')
    const lowStress = validDays.filter(d => d.stressLevel === 'Low' || d.stressLevel === 'Very low' || d.stressLevel === 'Moderate')

    const avgQuality = (days: DayData[]) => {
      if (days.length === 0) return 0
      const sum = days.reduce((acc, day) => acc + getSleepQualityScore(day.sleepQuality), 0)
      return sum / days.length
    }

    return {
      sweetCorrelation: {
        with: avgQuality(withSweets),
        without: avgQuality(withoutSweets),
        count: withSweets.length
      },
      caffeineCorrelation: {
        with: avgQuality(withCaffeine),
        without: avgQuality(withoutCaffeine),
        count: withCaffeine.length
      },
      screenCorrelation: {
        with: avgQuality(withScreen),
        without: avgQuality(withoutScreen),
        count: withScreen.length
      },
      stressCorrelation: {
        high: avgQuality(highStress),
        low: avgQuality(lowStress),
        countHigh: highStress.length
      },
      totalDays: validDays.length
    }
  }

  const metrics = calculateSleepMetrics()
  const analytics = calculateAnalytics()

  return (
    <div className={`sleep-diary ${darkMode ? 'dark-mode' : ''}`}>
      <button className="dark-mode-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? '☀️' : '🌙'}
      </button>

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

      <div className="view-switcher">
        <button
          className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
          onClick={() => setViewMode('week')}
        >
          Week Overview
        </button>
        <button
          className={`view-btn ${viewMode === 'day' ? 'active' : ''}`}
          onClick={() => setViewMode('day')}
        >
          Daily Entry
        </button>
        <button
          className={`view-btn ${viewMode === 'analytics' ? 'active' : ''}`}
          onClick={() => setViewMode('analytics')}
        >
          Analytics
        </button>
      </div>

      {viewMode === 'week' && (
        <div className="week-overview">
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
                    setViewMode('day')
                  }}
                >
                  <div className="day-card-header">
                    <span className="day-name">{day.dayOfWeek}</span>
                    <span className="sleep-emoji">{emoji}</span>
                  </div>

                  {day.date && (
                    <div className="day-date">{new Date(day.date).getDate()}</div>
                  )}

                  <div className="completion-bar">
                    <div
                      className="completion-fill"
                      style={{ width: `${completion}%` }}
                    />
                  </div>

                  <div className="day-stats">
                    {day.outOfBed && (
                      <span className="stat">🛏️ {day.outOfBed}</span>
                    )}
                    {day.stressLevel && (
                      <span className="stat-stress">
                        {day.stressLevel === 'Very high' || day.stressLevel === 'High' ? '⚠️' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {viewMode === 'day' && (
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
            {/* Date */}
            <div className="form-section">
              <h3 className="section-title">📅 Date</h3>
              <input
                type="date"
                value={weekData[selectedDayIndex].date}
                onChange={(e) => updateDayData(selectedDayIndex, 'date', e.target.value)}
                className="form-input"
              />
            </div>

            {/* Sleep Times */}
            <div className="form-section">
              <h3 className="section-title">🛏️ Sleep Times</h3>
              <div className="input-grid-2">
                <div className="input-group">
                  <label>
                    In bed at
                    <span className="help-text">When you got into bed</span>
                  </label>
                  <input
                    type="time"
                    value={weekData[selectedDayIndex].bedTime}
                    onChange={(e) => updateDayData(selectedDayIndex, 'bedTime', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="input-group">
                  <label>
                    Lights out at
                    <span className="help-text">When you tried to fall asleep</span>
                  </label>
                  <input
                    type="time"
                    value={weekData[selectedDayIndex].sleepAttemptTime}
                    onChange={(e) => updateDayData(selectedDayIndex, 'sleepAttemptTime', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="input-grid-2">
                <div className="input-group">
                  <label>
                    Woke up at
                    <span className="help-text">Final wake time in the morning</span>
                  </label>
                  <input
                    type="time"
                    value={weekData[selectedDayIndex].finalAwakening}
                    onChange={(e) => updateDayData(selectedDayIndex, 'finalAwakening', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="input-group">
                  <label>
                    Out of bed at
                    <span className="help-text">When you actually got up</span>
                  </label>
                  <input
                    type="time"
                    value={weekData[selectedDayIndex].outOfBed}
                    onChange={(e) => updateDayData(selectedDayIndex, 'outOfBed', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Sleep Disruptions */}
            <div className="form-section">
              <h3 className="section-title">😴 Sleep Disruptions</h3>
              <div className="input-group">
                <label>Time to fall asleep</label>
                <div className="button-group">
                  {['5 min', '15 min', '30 min', '45 min', '60+ min'].map(time => (
                    <button
                      key={time}
                      className={`choice-btn ${weekData[selectedDayIndex].timeToFallAsleep === time ? 'active' : ''}`}
                      onClick={() => updateDayData(selectedDayIndex, 'timeToFallAsleep', time)}
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
                    onChange={(e) => updateDayData(selectedDayIndex, 'nightAwakenings', e.target.value)}
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
                    onChange={(e) => updateDayData(selectedDayIndex, 'awakeningDuration', e.target.value)}
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
              <h3 className="section-title">🍽️ Lifestyle Factors</h3>
              <div className="toggle-grid">
                <div className="toggle-item">
                  <label>Sweets/Sugar (3hrs before bed)</label>
                  <div className="toggle-buttons">
                    <button
                      className={`toggle-btn ${weekData[selectedDayIndex].sweetIntake === 'Yes' ? 'active yes' : ''}`}
                      onClick={() => updateDayData(selectedDayIndex, 'sweetIntake', 'Yes')}
                    >
                      Yes
                    </button>
                    <button
                      className={`toggle-btn ${weekData[selectedDayIndex].sweetIntake === 'No' ? 'active no' : ''}`}
                      onClick={() => updateDayData(selectedDayIndex, 'sweetIntake', 'No')}
                    >
                      No
                    </button>
                  </div>
                  {weekData[selectedDayIndex].sweetIntake === 'Yes' && (
                    <input
                      type="time"
                      value={weekData[selectedDayIndex].sweetTime}
                      onChange={(e) => updateDayData(selectedDayIndex, 'sweetTime', e.target.value)}
                      className="form-input mt-2"
                      placeholder="What time?"
                    />
                  )}
                </div>

                <div className="toggle-item">
                  <label>Caffeine</label>
                  <div className="toggle-buttons">
                    <button
                      className={`toggle-btn ${weekData[selectedDayIndex].caffeineIntake === 'Yes' ? 'active yes' : ''}`}
                      onClick={() => updateDayData(selectedDayIndex, 'caffeineIntake', 'Yes')}
                    >
                      Yes
                    </button>
                    <button
                      className={`toggle-btn ${weekData[selectedDayIndex].caffeineIntake === 'No' ? 'active no' : ''}`}
                      onClick={() => updateDayData(selectedDayIndex, 'caffeineIntake', 'No')}
                    >
                      No
                    </button>
                  </div>
                  {weekData[selectedDayIndex].caffeineIntake === 'Yes' && (
                    <input
                      type="time"
                      value={weekData[selectedDayIndex].caffeineTime}
                      onChange={(e) => updateDayData(selectedDayIndex, 'caffeineTime', e.target.value)}
                      className="form-input mt-2"
                      placeholder="Last consumption"
                    />
                  )}
                </div>

                <div className="toggle-item">
                  <label>Screen time (2hrs before bed)</label>
                  <div className="toggle-buttons">
                    <button
                      className={`toggle-btn ${weekData[selectedDayIndex].screenUse === 'Yes' ? 'active yes' : ''}`}
                      onClick={() => updateDayData(selectedDayIndex, 'screenUse', 'Yes')}
                    >
                      Yes
                    </button>
                    <button
                      className={`toggle-btn ${weekData[selectedDayIndex].screenUse === 'No' ? 'active no' : ''}`}
                      onClick={() => updateDayData(selectedDayIndex, 'screenUse', 'No')}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Last hour activity before sleep</label>
                <div className="button-group-wrap">
                  {ACTIVITY_OPTIONS.map(activity => (
                    <button
                      key={activity}
                      className={`choice-btn ${weekData[selectedDayIndex].lastHourActivity === activity ? 'active' : ''}`}
                      onClick={() => updateDayData(selectedDayIndex, 'lastHourActivity', activity)}
                    >
                      {activity}
                    </button>
                  ))}
                </div>
                {weekData[selectedDayIndex].lastHourActivity === 'Other' && (
                  <input
                    type="text"
                    className="form-input mt-2"
                    placeholder="Specify activity..."
                  />
                )}
              </div>
            </div>

            {/* Quality & Mood */}
            <div className="form-section">
              <h3 className="section-title">💭 How Was It?</h3>
              <div className="input-group">
                <label>Stress Level</label>
                <div className="emoji-scale">
                  {[
                    { value: 'Very low', emoji: '😌', label: 'Very Low' },
                    { value: 'Low', emoji: '🙂', label: 'Low' },
                    { value: 'Moderate', emoji: '😐', label: 'Moderate' },
                    { value: 'High', emoji: '😰', label: 'High' },
                    { value: 'Very high', emoji: '😫', label: 'Very High' }
                  ].map(({ value, emoji, label }) => (
                    <button
                      key={value}
                      className={`emoji-btn ${weekData[selectedDayIndex].stressLevel === value ? 'active' : ''}`}
                      onClick={() => updateDayData(selectedDayIndex, 'stressLevel', value)}
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
                    { value: 'Very poor', emoji: '😴', label: 'Very Poor' },
                    { value: 'Poor', emoji: '😞', label: 'Poor' },
                    { value: 'Fair', emoji: '😐', label: 'Fair' },
                    { value: 'Good', emoji: '🙂', label: 'Good' },
                    { value: 'Very good', emoji: '😊', label: 'Very Good' }
                  ].map(({ value, emoji, label }) => (
                    <button
                      key={value}
                      className={`emoji-btn ${weekData[selectedDayIndex].sleepQuality === value ? 'active' : ''}`}
                      onClick={() => updateDayData(selectedDayIndex, 'sleepQuality', value)}
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
                  onChange={(e) => updateDayData(selectedDayIndex, 'notes', e.target.value)}
                  rows={3}
                  className="form-input"
                  placeholder="Anything that affected your sleep..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'analytics' && (
        <div className="analytics-view">
          <h2 className="analytics-title">Sleep Insights</h2>
          <p className="analytics-subtitle">
            {analytics.totalDays > 0
              ? `Based on ${analytics.totalDays} days of data`
              : 'Start tracking to see insights'}
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
                            backgroundColor: analytics.sweetCorrelation.with < analytics.sweetCorrelation.without ? '#ef4444' : '#10b981'
                          }}
                        />
                        <span className="comparison-value">{analytics.sweetCorrelation.with.toFixed(1)}/5</span>
                      </div>
                    </div>
                    <div className="comparison-item">
                      <span className="comparison-label">Without sweets</span>
                      <div className="comparison-bar-container">
                        <div
                          className="comparison-bar"
                          style={{
                            width: `${(analytics.sweetCorrelation.without / 5) * 100}%`,
                            backgroundColor: analytics.sweetCorrelation.without > analytics.sweetCorrelation.with ? '#10b981' : '#94a3b8'
                          }}
                        />
                        <span className="comparison-value">{analytics.sweetCorrelation.without.toFixed(1)}/5</span>
                      </div>
                    </div>
                  </div>
                  <p className="insight-conclusion">
                    {analytics.sweetCorrelation.with < analytics.sweetCorrelation.without
                      ? '⚠️ Sweets before bed may reduce sleep quality'
                      : analytics.sweetCorrelation.with > analytics.sweetCorrelation.without
                      ? '✓ No negative impact detected'
                      : '○ No clear pattern yet'}
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
                            backgroundColor: analytics.caffeineCorrelation.with < analytics.caffeineCorrelation.without ? '#ef4444' : '#10b981'
                          }}
                        />
                        <span className="comparison-value">{analytics.caffeineCorrelation.with.toFixed(1)}/5</span>
                      </div>
                    </div>
                    <div className="comparison-item">
                      <span className="comparison-label">Without caffeine</span>
                      <div className="comparison-bar-container">
                        <div
                          className="comparison-bar"
                          style={{
                            width: `${(analytics.caffeineCorrelation.without / 5) * 100}%`,
                            backgroundColor: analytics.caffeineCorrelation.without > analytics.caffeineCorrelation.with ? '#10b981' : '#94a3b8'
                          }}
                        />
                        <span className="comparison-value">{analytics.caffeineCorrelation.without.toFixed(1)}/5</span>
                      </div>
                    </div>
                  </div>
                  <p className="insight-conclusion">
                    {analytics.caffeineCorrelation.with < analytics.caffeineCorrelation.without
                      ? '⚠️ Caffeine may be affecting your sleep'
                      : analytics.caffeineCorrelation.with > analytics.caffeineCorrelation.without
                      ? '✓ No negative impact detected'
                      : '○ No clear pattern yet'}
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
                            backgroundColor: analytics.screenCorrelation.with < analytics.screenCorrelation.without ? '#ef4444' : '#10b981'
                          }}
                        />
                        <span className="comparison-value">{analytics.screenCorrelation.with.toFixed(1)}/5</span>
                      </div>
                    </div>
                    <div className="comparison-item">
                      <span className="comparison-label">Without screens</span>
                      <div className="comparison-bar-container">
                        <div
                          className="comparison-bar"
                          style={{
                            width: `${(analytics.screenCorrelation.without / 5) * 100}%`,
                            backgroundColor: analytics.screenCorrelation.without > analytics.screenCorrelation.with ? '#10b981' : '#94a3b8'
                          }}
                        />
                        <span className="comparison-value">{analytics.screenCorrelation.without.toFixed(1)}/5</span>
                      </div>
                    </div>
                  </div>
                  <p className="insight-conclusion">
                    {analytics.screenCorrelation.with < analytics.screenCorrelation.without
                      ? '⚠️ Screen time before bed may reduce sleep quality'
                      : analytics.screenCorrelation.with > analytics.screenCorrelation.without
                      ? '✓ No negative impact detected'
                      : '○ No clear pattern yet'}
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
                            backgroundColor: '#ef4444'
                          }}
                        />
                        <span className="comparison-value">{analytics.stressCorrelation.high.toFixed(1)}/5</span>
                      </div>
                    </div>
                    <div className="comparison-item">
                      <span className="comparison-label">Low stress days</span>
                      <div className="comparison-bar-container">
                        <div
                          className="comparison-bar"
                          style={{
                            width: `${(analytics.stressCorrelation.low / 5) * 100}%`,
                            backgroundColor: '#10b981'
                          }}
                        />
                        <span className="comparison-value">{analytics.stressCorrelation.low.toFixed(1)}/5</span>
                      </div>
                    </div>
                  </div>
                  <p className="insight-conclusion">
                    {analytics.stressCorrelation.high < analytics.stressCorrelation.low
                      ? '⚠️ Stress is significantly affecting your sleep'
                      : '✓ Stress has minimal impact on sleep quality'}
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

      <div className="copyright">
        © 2024 Sleep Diary - Track, analyze, and improve your sleep
      </div>
    </div>
  )
}

export default SleepDiary
