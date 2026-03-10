export default function AppHeader({ onSignOut }) {
  return (
    <div className="header">
      <h2>Minhas Tarefas</h2>

      <button className="logout" onClick={onSignOut}>
        ⎋ Sair
      </button>
    </div>
  );
}

