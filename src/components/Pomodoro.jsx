export default function Pomodoro({
  isBreak,
  timeText,
  isRunning,
  startPomodoro,
  pausePomodoro,
  resetPomodoro,
  focusMinutes,
  breakMinutes,
  setFocusMinutes,
  setBreakMinutes,
  soundEnabled,
  setSoundEnabled,
}) {
  return (
    <div className="pomodoro">
      <div className="pomodoro-head">
        <h3>Pomodoro</h3>
        <span className="pomodoro-mode">{isBreak ? "Pausa" : "Foco"}</span>
      </div>

      <div className="timer">{timeText}</div>

      <div className="pomodoro-settings">
        <label className="pomodoro-field">
          <span>Foco (min)</span>
          <input
            type="number"
            min="1"
            max="180"
            value={focusMinutes}
            onChange={(e) => setFocusMinutes(e.target.value)}
            disabled={isRunning}
          />
        </label>

        <label className="pomodoro-field">
          <span>Pausa (min)</span>
          <input
            type="number"
            min="1"
            max="60"
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(e.target.value)}
            disabled={isRunning}
          />
        </label>

        <label className="pomodoro-toggle">
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
          />
          <span>Som</span>
        </label>
      </div>

      <div className="pomodoro-buttons">
        <button onClick={startPomodoro} disabled={isRunning}>
          Iniciar
        </button>
        <button onClick={pausePomodoro} disabled={!isRunning}>
          Pausar
        </button>
        <button onClick={resetPomodoro}>Resetar</button>
      </div>
    </div>
  );
}
