import { useEffect, useState } from "react";
import "./App.css";
import { serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import AuthPanel from "./components/AuthPanel";
import AppHeader from "./components/AppHeader";
import ContentTabs from "./components/ContentTabs";
import Pomodoro from "./components/Pomodoro";
import StatsTab from "./components/StatsTab";
import TasksTab from "./components/TasksTab";

function getTaskDate(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== "function") {
    return null;
  }

  return timestamp.toDate();
}

function isSameDay(date, reference) {
  return (
    date.getDate() === reference.getDate() &&
    date.getMonth() === reference.getMonth() &&
    date.getFullYear() === reference.getFullYear()
  );
}

function getStartOfWeek(reference) {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  start.setDate(reference.getDate() - reference.getDay());
  return start;
}

function getStartOfMonth(reference) {
  return new Date(reference.getFullYear(), reference.getMonth(), 1);
}

function getTimestampValue(timestamp) {
  const date = getTaskDate(timestamp);
  return date ? date.getTime() : 0;
}

function formatTaskDate(timestamp) {
  const date = getTaskDate(timestamp);

  if (!date) {
    return "Agora há pouco";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function readLocalNumber(key, fallback) {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readLocalBool(key, fallback) {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw === null) return fallback;
  return raw === "1";
}

function clampInt(value, min, max, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function getRemainingSeconds(endTimeMs) {
  return Math.max(0, Math.ceil((endTimeMs - Date.now()) / 1000));
}

function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [activeTab, setActiveTab] = useState("tasks");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Média");
  const [tasks, setTasks] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [taskErrorMsg, setTaskErrorMsg] = useState("");
  const [isTasksLoading, setIsTasksLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [priorityFilter, setPriorityFilter] = useState("todas");
  const [sortBy, setSortBy] = useState("recentes");

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingPriority, setEditingPriority] = useState("Média");

  const [focusMinutesInput, setFocusMinutesInput] = useState(() =>
    String(readLocalNumber("pomodoro_focus_minutes", 25))
  );
  const [breakMinutesInput, setBreakMinutesInput] = useState(() =>
    String(readLocalNumber("pomodoro_break_minutes", 5))
  );
  const [soundEnabled, setSoundEnabled] = useState(() =>
    readLocalBool("pomodoro_sound_enabled", false)
  );

  const focusMinutes = clampInt(focusMinutesInput, 1, 180, 25);
  const breakMinutes = clampInt(breakMinutesInput, 1, 60, 5);

  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [endTimeMs, setEndTimeMs] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(
    focusMinutes * 60
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;

    setIsTasksLoading(true);

    const q = query(collection(db, "tasks"), where("userId", "==", user.uid));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setTasks(list);
        setIsTasksLoading(false);
      },
      () => {
        setTaskErrorMsg("Não foi possível carregar suas tarefas.");
        setIsTasksLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("pomodoro_focus_minutes", String(focusMinutes));
  }, [focusMinutes]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("pomodoro_break_minutes", String(breakMinutes));
  }, [breakMinutes]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("pomodoro_sound_enabled", soundEnabled ? "1" : "0");
  }, [soundEnabled]);

  useEffect(() => {
    if (isRunning) return;
    setRemainingSeconds((isBreak ? breakMinutes : focusMinutes) * 60);
  }, [isRunning, isBreak, focusMinutes, breakMinutes]);

  useEffect(() => {
    if (!isRunning || endTimeMs === null) return;

    const tick = () => {
      const nextRemaining = getRemainingSeconds(endTimeMs);
      if (nextRemaining <= 0) {
        if (soundEnabled) {
          playSound();
        }

        const nextIsBreak = !isBreak;
        const nextSeconds = (nextIsBreak ? breakMinutes : focusMinutes) * 60;
        setIsBreak(nextIsBreak);
        setRemainingSeconds(nextSeconds);
        setEndTimeMs(Date.now() + nextSeconds * 1000);
        return;
      }

      setRemainingSeconds(nextRemaining);
    };

    tick();
    const intervalId = setInterval(tick, 250);
    return () => clearInterval(intervalId);
  }, [isRunning, endTimeMs, isBreak, focusMinutes, breakMinutes, soundEnabled]);

  async function addTask() {
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setTaskErrorMsg("Digite um título válido para a tarefa.");
      return;
    }

    setTaskErrorMsg("");

    await addDoc(collection(db, "tasks"), {
      title: normalizedTitle,
      priority,
      status: "não iniciada",
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setTitle("");
  }

  async function updateStatus(id, status) {
    setTaskErrorMsg("");
    await updateDoc(doc(db, "tasks", id), {
      status,
      completedAt: status === "concluída" ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });
  }

  async function deleteTask(task) {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir esta tarefa?"
    );

    if (!confirmDelete) return;

    setTaskErrorMsg("");
    await updateDoc(doc(db, "tasks", task.id), {
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  function startEditingTask(task) {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
    setEditingPriority(task.priority);
    setTaskErrorMsg("");
  }

  function cancelEditingTask() {
    setEditingTaskId(null);
    setEditingTitle("");
    setEditingPriority("Média");
  }

  async function saveTaskEdit(id) {
    const normalizedTitle = editingTitle.trim();

    if (!normalizedTitle) {
      setTaskErrorMsg("O título editado não pode ficar vazio.");
      return;
    }

    setTaskErrorMsg("");
    await updateDoc(doc(db, "tasks", id), {
      title: normalizedTitle,
      priority: editingPriority,
      updatedAt: serverTimestamp(),
    });
    cancelEditingTask();
  }

  async function login() {
    setErrorMsg("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (error.code === "auth/invalid-credential") {
        setErrorMsg("Email ou senha incorretos.");
      } else if (error.code === "auth/user-not-found") {
        setErrorMsg("Usuário não cadastrado.");
      } else {
        setErrorMsg("Erro ao fazer login.");
      }
    }
  }

  async function register() {
    setErrorMsg("");

    if (!email || !password || !confirmPassword) {
      setErrorMsg("Preencha email, senha e confirmação de senha.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("As senhas não coincidem.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (error.code === "auth/weak-password") {
        setErrorMsg("A senha deve ter no mínimo 6 caracteres.");
      } else if (error.code === "auth/email-already-in-use") {
        setErrorMsg("Este email já está cadastrado.");
      } else if (error.code === "auth/invalid-email") {
        setErrorMsg("Email inválido.");
      } else {
        setErrorMsg("Erro ao cadastrar usuário.");
      }
    }
  }

  function switchAuthMode(mode) {
    setAuthMode(mode);
    setErrorMsg("");
    setPassword("");
    setConfirmPassword("");
  }

  function startPomodoro() {
    if (isRunning) return;
    setIsRunning(true);
    const baseSeconds =
      remainingSeconds > 0
        ? remainingSeconds
        : (isBreak ? breakMinutes : focusMinutes) * 60;
    setEndTimeMs(Date.now() + baseSeconds * 1000);
  }

  function pausePomodoro() {
    if (!isRunning) return;
    if (endTimeMs !== null) {
      setRemainingSeconds(getRemainingSeconds(endTimeMs));
    }
    setEndTimeMs(null);
    setIsRunning(false);
  }

  function resetPomodoro() {
    setIsRunning(false);
    setIsBreak(false);
    setEndTimeMs(null);
    setRemainingSeconds(focusMinutes * 60);
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  function playSound() {
    const audio = new Audio(
      "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg"
    );
    audio.play();
  }

  const now = new Date();
  const startOfWeek = getStartOfWeek(now);
  const startOfMonth = getStartOfMonth(now);

  const visibleTasks = tasks.filter((task) => !task.deletedAt);

  const completedDates = tasks
    .filter((task) => task.status === "concluída")
    .map((task) => getTaskDate(task.completedAt))
    .filter(Boolean);

  const completedToday = completedDates.filter((date) =>
    isSameDay(date, now)
  ).length;

  const completedThisWeek = completedDates.filter(
    (date) => date >= startOfWeek
  ).length;

  const completedThisMonth = completedDates.filter(
    (date) => date >= startOfMonth
  ).length;

  const pendingTasks = visibleTasks.filter(
    (task) => task.status !== "concluída"
  ).length;

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredTasks = visibleTasks.filter((task) => {
    const matchesSearch = normalizedSearchTerm
      ? task.title.toLowerCase().includes(normalizedSearchTerm)
      : true;
    const matchesStatus =
      statusFilter === "todas" ? true : task.status === statusFilter;
    const matchesPriority =
      priorityFilter === "todas" ? true : task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const priorityOrder = {
    Alta: 0,
    "Média": 1,
    Baixa: 2,
  };

  const filteredAndSortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "antigas") {
      return getTimestampValue(a.createdAt) - getTimestampValue(b.createdAt);
    }

    if (sortBy === "prioridade") {
      const byPriority =
        (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);

      if (byPriority !== 0) {
        return byPriority;
      }
    }

    return getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt);
  });

  const hasActiveFilters =
    normalizedSearchTerm ||
    statusFilter !== "todas" ||
    priorityFilter !== "todas" ||
    sortBy !== "recentes";

  if (!user) {
    return (
      <AuthPanel
        authMode={authMode}
        email={email}
        password={password}
        confirmPassword={confirmPassword}
        setEmail={setEmail}
        setPassword={setPassword}
        setConfirmPassword={setConfirmPassword}
        switchAuthMode={switchAuthMode}
        login={login}
        register={register}
        errorMsg={errorMsg}
      />
    );
  }

  return (
    <div className="container">
      <AppHeader onSignOut={() => signOut(auth)} />

      <ContentTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <Pomodoro
        isBreak={isBreak}
        timeText={formatTime(remainingSeconds)}
        isRunning={isRunning}
        startPomodoro={startPomodoro}
        pausePomodoro={pausePomodoro}
        resetPomodoro={resetPomodoro}
        focusMinutes={focusMinutesInput}
        breakMinutes={breakMinutesInput}
        setFocusMinutes={setFocusMinutesInput}
        setBreakMinutes={setBreakMinutesInput}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
      />

      {activeTab === "tasks" ? (
        <TasksTab
          title={title}
          setTitle={setTitle}
          priority={priority}
          setPriority={setPriority}
          addTask={addTask}
          taskErrorMsg={taskErrorMsg}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          isTasksLoading={isTasksLoading}
          hasActiveFilters={hasActiveFilters}
          tasks={filteredAndSortedTasks}
          editingTaskId={editingTaskId}
          editingTitle={editingTitle}
          setEditingTitle={setEditingTitle}
          editingPriority={editingPriority}
          setEditingPriority={setEditingPriority}
          saveTaskEdit={saveTaskEdit}
          cancelEditingTask={cancelEditingTask}
          startEditingTask={startEditingTask}
          updateStatus={updateStatus}
          deleteTask={deleteTask}
          formatTaskDate={formatTaskDate}
        />
      ) : (
        <StatsTab
          completedToday={completedToday}
          completedThisWeek={completedThisWeek}
          completedThisMonth={completedThisMonth}
          pendingTasks={pendingTasks}
        />
      )}
    </div>
  );
}

export default App;
