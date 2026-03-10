export default function AuthPanel({
  authMode,
  email,
  password,
  confirmPassword,
  setEmail,
  setPassword,
  setConfirmPassword,
  switchAuthMode,
  login,
  register,
  errorMsg,
}) {
  return (
    <div className="container">
      <h2>{authMode === "login" ? "Login" : "Criar conta"}</h2>

      <div className="auth-toggle">
        <button
          className={authMode === "login" ? "auth-tab active" : "auth-tab"}
          onClick={() => switchAuthMode("login")}
        >
          Entrar
        </button>
        <button
          className={authMode === "register" ? "auth-tab active" : "auth-tab"}
          onClick={() => switchAuthMode("register")}
        >
          Cadastrar
        </button>
      </div>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {authMode === "register" && (
        <input
          type="password"
          placeholder="Confirmar senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      )}

      <button
        className="btn-primary"
        onClick={authMode === "login" ? login : register}
      >
        {authMode === "login" ? "Entrar" : "Criar conta"}
      </button>

      <button
        className="btn-secondary"
        onClick={authMode === "login" ? () => switchAuthMode("register") : register}
      >
        {authMode === "login" ? "Ir para cadastro" : "Finalizar cadastro"}
      </button>

      {errorMsg && <p className="message-error">{errorMsg}</p>}
    </div>
  );
}

