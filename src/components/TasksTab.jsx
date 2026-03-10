export default function TasksTab({
  title,
  setTitle,
  priority,
  setPriority,
  addTask,
  taskErrorMsg,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  sortBy,
  setSortBy,
  isTasksLoading,
  hasActiveFilters,
  tasks,
  editingTaskId,
  editingTitle,
  setEditingTitle,
  editingPriority,
  setEditingPriority,
  saveTaskEdit,
  cancelEditingTask,
  startEditingTask,
  updateStatus,
  deleteTask,
  formatTaskDate,
}) {
  return (
    <>
      <div className="task-form">
        <input
          placeholder="Nova tarefa"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option>Média</option>
          <option>Alta</option>
          <option>Baixa</option>
        </select>
      </div>

      <button className="btn-primary" onClick={addTask}>
        Adicionar tarefa
      </button>

      {taskErrorMsg && <p className="message-error">{taskErrorMsg}</p>}

      <div className="filters-panel">
        <input
          placeholder="Buscar tarefa"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="filter-grid">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="todas">Todos os status</option>
            <option value="não iniciada">Não iniciadas</option>
            <option value="em andamento">Em andamento</option>
            <option value="concluída">Concluídas</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="todas">Todas as prioridades</option>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="recentes">Mais recentes</option>
            <option value="antigas">Mais antigas</option>
            <option value="prioridade">Por prioridade</option>
          </select>
        </div>
      </div>

      {isTasksLoading ? (
        <p className="message-info">Carregando tarefas...</p>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <h3>Nenhuma tarefa encontrada</h3>
          <p>
            {hasActiveFilters
              ? "Ajuste os filtros ou a busca para ver mais resultados."
              : "Crie sua primeira tarefa para começar a organizar o dia."}
          </p>
        </div>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={`task ${task.status === "concluída" ? "completed" : ""}`}
            >
              {editingTaskId === task.id ? (
                <div className="task-edit-form">
                  <input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                  />

                  <select
                    value={editingPriority}
                    onChange={(e) => setEditingPriority(e.target.value)}
                  >
                    <option>Alta</option>
                    <option>Média</option>
                    <option>Baixa</option>
                  </select>

                  <div className="task-buttons">
                    <button
                      className="btn-status"
                      onClick={() => saveTaskEdit(task.id)}
                    >
                      Salvar
                    </button>
                    <button className="btn-secondary" onClick={cancelEditingTask}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="task-header">
                    <strong>{task.title}</strong>
                    <span className={`priority ${task.priority}`}>
                      {task.priority}
                    </span>
                  </div>

                  <small>Status: {task.status}</small>
                  <small className="task-meta">
                    Criada em {formatTaskDate(task.createdAt)} | Atualizada em{" "}
                    {formatTaskDate(task.updatedAt || task.createdAt)}
                  </small>

                  <div className="task-buttons">
                    <button
                      className="btn-status"
                      onClick={() => updateStatus(task.id, "concluída")}
                    >
                      Concluir
                    </button>

                    <button
                      className="btn-secondary"
                      onClick={() => updateStatus(task.id, "em andamento")}
                    >
                      Em andamento
                    </button>

                    <button
                      className="btn-secondary edit-button"
                      onClick={() => startEditingTask(task)}
                    >
                      Editar
                    </button>

                    <button className="btn-danger" onClick={() => deleteTask(task)}>
                      Excluir
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

