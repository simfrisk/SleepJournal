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

function SleepDiary() {
  const [bedtime, setBedtime] = useState('')
  const [riseTime, setRiseTime] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')
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
    // Parse formats like "30 min", "1 hour", "1.5 hours", "90 minutes"
    const match = durStr.match(/(\d+\.?\d*)\s*(min|hour|hr)/i)
    if (!match) return 0
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
      // Calculate sleep window (from sleep attempt to out of bed)
      let sleepAttempt = parseTime(day.sleepAttemptTime)
      let outOfBed = parseTime(day.outOfBed)

      // Handle overnight (if out of bed time is earlier than sleep attempt, add 24 hours)
      if (outOfBed < sleepAttempt) {
        outOfBed += 24 * 60
      }

      const sleepWindow = outOfBed - sleepAttempt
      totalSleepWindow += sleepWindow

      // Calculate time awake (time to fall asleep + awakening duration)
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

  const metrics = calculateSleepMetrics()

  return (
    <div className={`sleep-diary ${darkMode ? 'dark-mode' : ''}`}>
      <button className="dark-mode-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? '☀️' : '🌙'}
      </button>
      <div className="header">
        <div className="title-section">
          <h1 className="title">Sleep Diary</h1>
          <p className="subtitle">Exact times are not necessary. Estimates are all you need.</p>
        </div>
        <div className="sleep-schedule">
          <div className="schedule-label">SLEEP SCHEDULE</div>
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
          Week View
        </button>
        <button
          className={`view-btn ${viewMode === 'day' ? 'active' : ''}`}
          onClick={() => setViewMode('day')}
        >
          Day View
        </button>
      </div>

      {viewMode === 'week' ? (
        <div className="table-container">
        <table className="sleep-table">
          <thead>
            <tr>
              <th className="question-col">DAY OF THE WEEK</th>
              {DAYS.map(day => (
                <th key={day}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="question-col">DATE</td>
              {weekData.map((day, index) => (
                <td key={index}>
                  <input
                    type="date"
                    value={day.date}
                    onChange={(e) => updateDayData(index, 'date', e.target.value)}
                  />
                </td>
              ))}
            </tr>

            <tr>
              <td className="question-col">
                <span className="q-number">Q1</span>
                <span className="q-text">What time did you get into bed?</span>
              </td>
              {weekData.map((day, index) => (
                <td key={index}>
                  <input
                    type="time"
                    value={day.bedTime}
                    onChange={(e) => updateDayData(index, 'bedTime', e.target.value)}
                  />
                </td>
              ))}
            </tr>

            <tr>
              <td className="question-col">
                <span className="q-number">Q2</span>
                <span className="q-text">What time did you try to go to sleep?</span>
              </td>
              {weekData.map((day, index) => (
                <td key={index}>
                  <input
                    type="time"
                    value={day.sleepAttemptTime}
                    onChange={(e) => updateDayData(index, 'sleepAttemptTime', e.target.value)}
                  />
                </td>
              ))}
            </tr>

            <tr>
              <td className="question-col">
                <span className="q-number">Q3</span>
                <span className="q-text">How long did it take you to fall asleep?</span>
              </td>
              {weekData.map((day, index) => (
                <td key={index}>
                  <input
                    type="text"
                    placeholder="e.g. 30 min"
                    value={day.timeToFallAsleep}
                    onChange={(e) => updateDayData(index, 'timeToFallAsleep', e.target.value)}
                  />
                </td>
              ))}
            </tr>

            <tr>
              <td className="question-col">
                <span className="q-number">Q4</span>
                <span className="q-text">How many times did you wake up, not counting your final awakening?</span>
              </td>
              {weekData.map((day, index) => (
                <td key={index}>
                  <input
                    type="number"
                    min="0"
                    value={day.nightAwakenings}
                    onChange={(e) => updateDayData(index, 'nightAwakenings', e.target.value)}
                  />
                </td>
              ))}
            </tr>

            <tr>
              <td className="question-col">
                <span className="q-number">Q5</span>
                <span className="q-text">In total, how long did these awakenings last?</span>
              </td>
              {weekData.map((day, index) => (
                <td key={index}>
                  <input
                    type="text"
                    placeholder="e.g. 1 hour"
                    value={day.awakeningDuration}
                    onChange={(e) => updateDayData(index, 'awakeningDuration', e.target.value)}
                  />
                </td>
              ))}
            </tr>

            <tr>
              <td className="question-col">
                <span className="q-number">Q6</span>
                <span className="q-text">What time was your final awakening?</span>
              </td>
              {weekData.map((day, index) => (
                <td key={index}>
                  <input
                    type="time"
                    value={day.finalAwakening}
                    onChange={(e) => updateDayData(index, 'finalAwakening', e.target.value)}
                  />
                </td>
              ))}
            </tr>

            <tr>
              <td className="question-col">
                <span className="q-number">Q7</span>
                <span className="q-text">What time did you get out of bed for the day?</span>
              </td>
              {weekData.map((day, index) => (
                <td key={index}>
                  <input
                    type="time"
                    value={day.outOfBed}
                    onChange={(e) => updateDayData(index, 'outOfBed', e.target.value)}
                  />
                </td>
              ))}
            </tr>

            <tr>
              <td className="question-col">
                <span className="q-number">Q8</span>
                <span className="q-text">Did you consume sweets or sugary foods/drinks within 3 hours of bedtime?</span>
              </td>
              {weekData.map((day, index) => (
                <td key={index}>
                  <select
                    value={day.sweetIntake}
                    onChange={(e) => updateDayData(index, 'sweetIntake', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </td>
              ))}
            </tr>

            <tr>
              <td className="question-col">
                <span className="q-number">Q9</span>
                <span className="q-text">If yes, what time did you consume sweets?</span>
              </td>
              {weekData.map((day, index) => (
                <td key={index}>
                  <input
                    type="time"
                    value={day.sweetTime}
                    onChange={(e) => updateDayData(index, 'sweetTime', e.target.value)}
                    disabled={day.sweetIntake !== 'Yes'}
                  />
                </td>
              ))}
            </tr>

            <tr>
              <td className="question-col">
                <span className="q-number">Q10</span>
                <span className="q-text">Did you consume caffeine (coffee, tea, energy drinks, etc.)?</span>
              </td>
              {weekData.map((day, index) => (
                <td key={index}>
                  <select
                    value={day.caffeineIntake}
                    onChange={(e) => updateDayData(index, 'caffeineIntake', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </td>
              ))}
            </tr>

            <tr>
              <td className="question-col">
                <span className="q-number">Q11</span>
                <span className="q-text">If yes, what was the last time you consumed caffeine?</span>
              </td>
              {weekData.map((day, index) => (
                <td key={index}>
                  <input
                    type="time"
                    value={day.caffeineTime}
                    onChange={(e) => updateDayData(index, 'caffeineTime', e.target.value)}
                    disabled={day.caffeineIntake !== 'Yes'}
                  />
                </td>
              ))}
            </tr>

            <tr>
              <td className="question-col">
                <span className="q-number">Q12</span>
                <span className="q-text">Did you use electronic screens (computer, phone, TV, tablet) in the 2 hours before bed?</span>
              </td>
              {weekData.map((day, index) => (
                <td key={index}>
                  <select
                    value={day.screenUse}
                    onChange={(e) => updateDayData(index, 'screenUse', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </td>
              ))}
            </tr>

            <tr>
              <td className="question-col">
                <span className="q-number">Q13</span>
                <span className="q-text">What was your primary activity in the hour before attempting to sleep?</span>
              </td>
              {weekData.map((day, index) => (
                <td key={index}>
                  <input
                    type="text"
                    placeholder="e.g. reading, watching TV"
                    value={day.lastHourActivity}
                    onChange={(e) => updateDayData(index, 'lastHourActivity', e.target.value)}
                  />
                </td>
              ))}
            </tr>

            <tr className="quality-row">
              <td className="question-col">
                <span className="q-number">Q14</span>
                <span className="q-text">How would you rate your overall stress level today?</span>
              </td>
              {weekData.map((day, index) => (
                <td key={index}>
                  <div className="radio-group">
                    {['Very low', 'Low', 'Moderate', 'High', 'Very high'].map(stress => (
                      <label key={stress} className="radio-label">
                        <input
                          type="radio"
                          name={`stress-${index}`}
                          value={stress}
                          checked={day.stressLevel === stress}
                          onChange={(e) => updateDayData(index, 'stressLevel', e.target.value)}
                        />
                        {stress}
                      </label>
                    ))}
                  </div>
                </td>
              ))}
            </tr>

            <tr className="quality-row">
              <td className="question-col">
                <span className="q-number">Q15</span>
                <span className="q-text">How would you rate the quality of your sleep?</span>
              </td>
              {weekData.map((day, index) => (
                <td key={index}>
                  <div className="radio-group">
                    {['Very poor', 'Poor', 'Fair', 'Good', 'Very good'].map(quality => (
                      <label key={quality} className="radio-label">
                        <input
                          type="radio"
                          name={`quality-${index}`}
                          value={quality}
                          checked={day.sleepQuality === quality}
                          onChange={(e) => updateDayData(index, 'sleepQuality', e.target.value)}
                        />
                        {quality}
                      </label>
                    ))}
                  </div>
                </td>
              ))}
            </tr>

            <tr>
              <td className="question-col">
                <span className="q-number">Q16</span>
                <span className="q-text">Note anything that interfered with your sleep.</span>
              </td>
              {weekData.map((day, index) => (
                <td key={index}>
                  <textarea
                    value={day.notes}
                    onChange={(e) => updateDayData(index, 'notes', e.target.value)}
                    rows={3}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      ) : (
        <div className="day-view">
          <div className="day-navigation">
            <button
              className="nav-btn"
              onClick={() => setSelectedDayIndex((selectedDayIndex - 1 + 7) % 7)}
            >
              ← Previous Day
            </button>
            <h2 className="current-day">{DAYS[selectedDayIndex]}</h2>
            <button
              className="nav-btn"
              onClick={() => setSelectedDayIndex((selectedDayIndex + 1) % 7)}
            >
              Next Day →
            </button>
          </div>

          <div className="day-form">
            <div className="form-group">
              <label className="form-label">
                <span className="q-number">Q1</span>
                <span className="q-text">Date</span>
              </label>
              <input
                type="date"
                value={weekData[selectedDayIndex].date}
                onChange={(e) => updateDayData(selectedDayIndex, 'date', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="q-number">Q1</span>
                <span className="q-text">What time did you get into bed?</span>
              </label>
              <input
                type="time"
                value={weekData[selectedDayIndex].bedTime}
                onChange={(e) => updateDayData(selectedDayIndex, 'bedTime', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="q-number">Q2</span>
                <span className="q-text">What time did you try to go to sleep?</span>
              </label>
              <input
                type="time"
                value={weekData[selectedDayIndex].sleepAttemptTime}
                onChange={(e) => updateDayData(selectedDayIndex, 'sleepAttemptTime', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="q-number">Q3</span>
                <span className="q-text">How long did it take you to fall asleep?</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 30 min"
                value={weekData[selectedDayIndex].timeToFallAsleep}
                onChange={(e) => updateDayData(selectedDayIndex, 'timeToFallAsleep', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="q-number">Q4</span>
                <span className="q-text">How many times did you wake up, not counting your final awakening?</span>
              </label>
              <input
                type="number"
                min="0"
                value={weekData[selectedDayIndex].nightAwakenings}
                onChange={(e) => updateDayData(selectedDayIndex, 'nightAwakenings', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="q-number">Q5</span>
                <span className="q-text">In total, how long did these awakenings last?</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 1 hour"
                value={weekData[selectedDayIndex].awakeningDuration}
                onChange={(e) => updateDayData(selectedDayIndex, 'awakeningDuration', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="q-number">Q6</span>
                <span className="q-text">What time was your final awakening?</span>
              </label>
              <input
                type="time"
                value={weekData[selectedDayIndex].finalAwakening}
                onChange={(e) => updateDayData(selectedDayIndex, 'finalAwakening', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="q-number">Q7</span>
                <span className="q-text">What time did you get out of bed for the day?</span>
              </label>
              <input
                type="time"
                value={weekData[selectedDayIndex].outOfBed}
                onChange={(e) => updateDayData(selectedDayIndex, 'outOfBed', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="q-number">Q8</span>
                <span className="q-text">Did you consume sweets or sugary foods/drinks within 3 hours of bedtime?</span>
              </label>
              <select
                value={weekData[selectedDayIndex].sweetIntake}
                onChange={(e) => updateDayData(selectedDayIndex, 'sweetIntake', e.target.value)}
                className="form-input"
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="q-number">Q9</span>
                <span className="q-text">If yes, what time did you consume sweets?</span>
              </label>
              <input
                type="time"
                value={weekData[selectedDayIndex].sweetTime}
                onChange={(e) => updateDayData(selectedDayIndex, 'sweetTime', e.target.value)}
                disabled={weekData[selectedDayIndex].sweetIntake !== 'Yes'}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="q-number">Q10</span>
                <span className="q-text">Did you consume caffeine (coffee, tea, energy drinks, etc.)?</span>
              </label>
              <select
                value={weekData[selectedDayIndex].caffeineIntake}
                onChange={(e) => updateDayData(selectedDayIndex, 'caffeineIntake', e.target.value)}
                className="form-input"
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="q-number">Q11</span>
                <span className="q-text">If yes, what was the last time you consumed caffeine?</span>
              </label>
              <input
                type="time"
                value={weekData[selectedDayIndex].caffeineTime}
                onChange={(e) => updateDayData(selectedDayIndex, 'caffeineTime', e.target.value)}
                disabled={weekData[selectedDayIndex].caffeineIntake !== 'Yes'}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="q-number">Q12</span>
                <span className="q-text">Did you use electronic screens (computer, phone, TV, tablet) in the 2 hours before bed?</span>
              </label>
              <select
                value={weekData[selectedDayIndex].screenUse}
                onChange={(e) => updateDayData(selectedDayIndex, 'screenUse', e.target.value)}
                className="form-input"
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="q-number">Q13</span>
                <span className="q-text">What was your primary activity in the hour before attempting to sleep?</span>
              </label>
              <input
                type="text"
                placeholder="e.g. reading, watching TV"
                value={weekData[selectedDayIndex].lastHourActivity}
                onChange={(e) => updateDayData(selectedDayIndex, 'lastHourActivity', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="q-number">Q14</span>
                <span className="q-text">How would you rate your overall stress level today?</span>
              </label>
              <div className="radio-group">
                {['Very low', 'Low', 'Moderate', 'High', 'Very high'].map(stress => (
                  <label key={stress} className="radio-label">
                    <input
                      type="radio"
                      name="stress-level"
                      value={stress}
                      checked={weekData[selectedDayIndex].stressLevel === stress}
                      onChange={(e) => updateDayData(selectedDayIndex, 'stressLevel', e.target.value)}
                    />
                    {stress}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="q-number">Q15</span>
                <span className="q-text">How would you rate the quality of your sleep?</span>
              </label>
              <div className="radio-group">
                {['Very poor', 'Poor', 'Fair', 'Good', 'Very good'].map(quality => (
                  <label key={quality} className="radio-label">
                    <input
                      type="radio"
                      name="sleep-quality"
                      value={quality}
                      checked={weekData[selectedDayIndex].sleepQuality === quality}
                      onChange={(e) => updateDayData(selectedDayIndex, 'sleepQuality', e.target.value)}
                    />
                    {quality}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="q-number">Q16</span>
                <span className="q-text">Note anything that interfered with your sleep.</span>
              </label>
              <textarea
                value={weekData[selectedDayIndex].notes}
                onChange={(e) => updateDayData(selectedDayIndex, 'notes', e.target.value)}
                rows={5}
                className="form-input"
              />
            </div>
          </div>
        </div>
      )}

      <div className="footer">
        <div className="calculations-box">
          <div className="calc-icon">📊</div>
          <div className="calc-content">
            <h3>End-of-week calculations</h3>
            <p>Easy calculations at <a href="https://mysleepwell.ca/calculator" target="_blank" rel="noopener noreferrer">mysleepwell.ca/calculator</a></p>
          </div>
        </div>

        <div className="sleep-numbers">
          <h3>SLEEP NUMBERS</h3>
        </div>

        <div className="metrics">
          <div className="metric">
            <span className="metric-number">1</span>
            <span className="metric-label">Sleep window:</span>
            <span className="metric-value">{metrics.sleepWindow}</span>
          </div>
          <div className="metric">
            <span className="metric-number">2</span>
            <span className="metric-label">Time awake:</span>
            <span className="metric-value">{metrics.timeAwake}</span>
          </div>
        </div>

        <div className="metrics">
          <div className="metric">
            <span className="metric-number">3</span>
            <span className="metric-label">Time asleep:</span>
            <span className="metric-value">{metrics.timeAsleep}</span>
          </div>
          <div className="metric">
            <span className="metric-number">4</span>
            <span className="metric-label">Sleep efficiency:</span>
            <span className="metric-value">{metrics.efficiency}%</span>
          </div>
        </div>
      </div>

      <div className="copyright">
        © 2018 D. Gardner, A. Murphy - Update: Dec 2024
      </div>
    </div>
  )
}

export default SleepDiary
