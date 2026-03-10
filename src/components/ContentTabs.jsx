export default function ContentTabs({ activeTab, setActiveTab }) {
  return (
    <div className="content-tabs">
      <button
        className={activeTab === "tasks" ? "content-tab active" : "content-tab"}
        onClick={() => setActiveTab("tasks")}
      >
        Tarefas
      </button>
      <button
        className={activeTab === "stats" ? "content-tab active" : "content-tab"}
        onClick={() => setActiveTab("stats")}
      >
        Estatísticas
      </button>
    </div>
  );
}

