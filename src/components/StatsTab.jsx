export default function StatsTab({
  completedToday,
  completedThisWeek,
  completedThisMonth,
  pendingTasks,
}) {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <span className="stat-label">Concluídas hoje</span>
        <strong className="stat-value">{completedToday}</strong>
      </div>
      <div className="stat-card">
        <span className="stat-label">Concluídas na semana</span>
        <strong className="stat-value">{completedThisWeek}</strong>
      </div>
      <div className="stat-card">
        <span className="stat-label">Concluídas no mês</span>
        <strong className="stat-value">{completedThisMonth}</strong>
      </div>
      <div className="stat-card pending">
        <span className="stat-label">Pendentes</span>
        <strong className="stat-value">{pendingTasks}</strong>
      </div>
    </div>
  );
}

