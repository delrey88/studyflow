import { useState, useEffect } from 'react'
import './App.css'

const API = '/api'

const TIMES = {
  work: 1500,
  shortBreak: 300,
  longBreak: 900
}

const MODES = {
  work: { label: 'Foco', tag: 'FOCO PROFUNDO', c1: '#6d6af8', c2: '#b06ef9' },
  shortBreak: { label: 'Pausa Curta', tag: 'RECARGA RÁPIDA', c1: '#22d3ee', c2: '#5ea2fa' },
  longBreak: { label: 'Pausa Longa', tag: 'CICLO COMPLETO', c1: '#c084fc', c2: '#f472b6' }
}

const MODE_ORDER = ['work', 'shortBreak', 'longBreak']
const RING_R = 118
const RING_C = 2 * Math.PI * RING_R

function LogoMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="lgFlow" x1="8" y1="56" x2="56" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="0.55" stopColor="#818cf8" />
          <stop offset="1" stopColor="#c084fc" />
        </linearGradient>
        <filter id="lgGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g stroke="url(#lgFlow)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" filter="url(#lgGlow)">
        <path d="M32 7 C28.6 10.4 27.2 14.4 27.2 18.6 L27.2 27.4 H36.8 V18.6 C36.8 14.4 35.4 10.4 32 7 Z" />
        <circle cx="32" cy="18.4" r="2.1" strokeWidth="1.8" />
        <path d="M27.2 22.6 L22.6 29.4 L27.2 27.6" strokeWidth="2.1" />
        <path d="M36.8 22.6 L41.4 29.4 L36.8 27.6" strokeWidth="2.1" />
        <path d="M32 30.6 V34.2" strokeDasharray="1 3.4" strokeWidth="2.2" />
        <path d="M13 42.4 C19.4 38.8 27.6 39.4 32 44.2 C36.4 39.4 44.6 38.8 51 42.4 L47 50.8 C41.4 48 35.8 49.2 32 53.2 C28.2 49.2 22.6 48 17 50.8 Z" />
        <path d="M32 44.4 V52.8" strokeWidth="2" opacity="0.85" />
      </g>
    </svg>
  )
}

const cleanTitle = (t) =>
  String(t || '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .trim()

const dayKey = (v) => {
  const d = new Date(v)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function App() {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [sessions, setSessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [serverError, setServerError] = useState(false)

  // Estados do Pomodoro Avançado
  const [mode, setMode] = useState('work') // 'work' | 'shortBreak' | 'longBreak'
  const [secondsLeft, setSecondsLeft] = useState(TIMES.work)
  const [isActive, setIsActive] = useState(false)
  const [pomodoroCount, setPomodoroCount] = useState(0)

  // Pedir permissão para notificações do navegador ao carregar
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
  }, [])

  // Som de alerta via Web Audio API
  const playSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime)
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      oscillator.start()
      oscillator.stop(audioCtx.currentTime + 0.5)
    } catch (e) {
      console.error('Erro ao tocar som:', e)
    }
  }

  const sendNotification = (title, body) => {
    playSound()
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body })
    }
  }

  // Buscar Tarefas e Histórico (API serverless na própria Netlify)
  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      fetch(`${API}/tasks`).then((res) => res.json()),
      fetch(`${API}/sessions`).then((res) => res.json())
    ])
      .then(([tasksData, sessionsData]) => {
        setTasks(tasksData)
        setSessions(sessionsData)
        setIsLoading(false)
        setServerError(false)
      })
      .catch((err) => {
        console.error('Erro ao conectar com a API:', err)
        setIsLoading(false)
        setServerError(true)
      })
  }, [])

  // Lógica do Timer, Transição Automática e Gravação Dinâmica da Jornada
  useEffect(() => {
    let timer = null
    if (isActive && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => prev - 1)
      }, 1000)
    } else if (isActive && secondsLeft === 0) {
      setIsActive(false)
      if (mode === 'work') {
        const newCount = pomodoroCount + 1
        setPomodoroCount(newCount)

        fetch(`${API}/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Sessão de Foco Concluída',
            duration: TIMES.work / 60
          })
        })
          .then((res) => res.json())
          .then((data) => setSessions((prev) => [data, ...prev]))
          .catch((err) => console.error('Erro ao salvar sessão:', err))

        if (newCount % 4 === 0) {
          setMode('longBreak')
          setSecondsLeft(TIMES.longBreak)
          sendNotification('Pomodoro Concluído!', 'Hora de uma pausa longa 🍅')
        } else {
          setMode('shortBreak')
          setSecondsLeft(TIMES.shortBreak)
          sendNotification('Pomodoro Concluído!', 'Hora de uma pausa curta ☕')
        }
      } else {
        setMode('work')
        setSecondsLeft(TIMES.work)
        sendNotification('Pausa Finalizada!', 'Hora de voltar ao foco 🚀')
      }
    }
    return () => clearInterval(timer)
  }, [isActive, secondsLeft, mode, pomodoroCount])

  const switchMode = (newMode) => {
    setIsActive(false)
    setMode(newMode)
    setSecondsLeft(TIMES[newMode])
  }

  const formatTime = (sec) => {
    const minutes = Math.floor(sec / 60)
    const seconds = sec % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const addTask = (e) => {
    e.preventDefault()
    if (!newTask.trim()) return

    fetch(`${API}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTask })
    })
      .then((res) => res.json())
      .then((data) => {
        setTasks([...tasks, data])
        setNewTask('')
      })
      .catch((err) => console.error('Erro ao criar tarefa:', err))
  }

  const toggleTask = (id, currentCompleted) => {
    const newCompleted = currentCompleted ? 0 : 1

    fetch(`${API}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: newCompleted })
    })
      .then(() => {
        setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: newCompleted } : task)))
      })
      .catch((err) => console.error('Erro ao atualizar tarefa:', err))
  }

  const deleteTask = (id) => {
    fetch(`${API}/tasks/${id}`, {
      method: 'DELETE'
    })
      .then(() => {
        setTasks(tasks.filter((task) => task.id !== id))
      })
      .catch((err) => console.error('Erro ao deletar tarefa:', err))
  }

  // Derivados do timer
  const m = MODES[mode]
  const totalTime = TIMES[mode]
  const progress = ((totalTime - secondsLeft) / totalTime) * 100
  const segIndex = MODE_ORDER.indexOf(mode)
  const cycleFilled = pomodoroCount % 4 === 0 && pomodoroCount > 0 ? 4 : pomodoroCount % 4

  // Métricas de foco (últimos 7 dias)
  const week = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    week.push({
      key: dayKey(d),
      label: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][d.getDay()],
      mins: 0
    })
  }
  let totalMins = 0
  sessions.forEach((s) => {
    totalMins += Number(s.duration) || 0
    const slot = week.find((w) => w.key === dayKey(s.created_at))
    if (slot) slot.mins += Number(s.duration) || 0
  })
  const maxDayMins = Math.max(...week.map((w) => w.mins), TIMES.work / 60)
  const todayMins = week[week.length - 1].mins
  const avgMins = sessions.length ? totalMins / sessions.length : 0

  const statusChip = isLoading
    ? { cls: 'sync', label: 'SINCRONIZANDO' }
    : serverError
      ? { cls: 'off', label: 'OFFLINE' }
      : { cls: 'on', label: 'ONLINE' }

  return (
    <div className="app-shell" style={{ '--mc1': m.c1, '--mc2': m.c2 }}>
      <div className="ambient a-1" aria-hidden="true" />
      <div className="ambient a-2" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <LogoMark />
          <div className="brand-text">
            <h1>StudyFlow</h1>
            <p>Organize seus estudos e potencialize seu aprendizado</p>
          </div>
        </div>
        <div className={`status-chip ${statusChip.cls}`}>
          <span className="dot" />
          {statusChip.label}
        </div>
      </header>

      {isLoading && (
        <div className="banner info">
          <span className="pulse" /> Sincronizando dados com o servidor…
        </div>
      )}

      {serverError && (
        <div className="banner warn">
          <span className="pulse" /> Não foi possível conectar ao servidor. As alterações podem não ser salvas.
        </div>
      )}

      <main className="grid">
        {/* Módulo do Temporizador */}
        <section className="panel timer-panel">
          <span className="corner c-tl" aria-hidden="true" />
          <span className="corner c-tr" aria-hidden="true" />
          <span className="corner c-bl" aria-hidden="true" />
          <span className="corner c-br" aria-hidden="true" />

          <div className="segmented" role="tablist" aria-label="Modos do temporizador">
            <span className="seg-glider" style={{ transform: `translateX(${segIndex * 100}%)` }} />
            {MODE_ORDER.map((key) => (
              <button
                key={key}
                role="tab"
                aria-selected={mode === key}
                className={mode === key ? 'active' : ''}
                onClick={() => switchMode(key)}
              >
                {MODES[key].label}
              </button>
            ))}
          </div>

          <div className="ring-wrap">
            <svg className="ring" viewBox="0 0 280 280">
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={m.c1} />
                  <stop offset="100%" stopColor={m.c2} />
                </linearGradient>
              </defs>
              <g aria-hidden="true">
                {Array.from({ length: 60 }).map((_, i) => (
                  <line
                    key={i}
                    className={i % 5 ? 'tick minor' : 'tick major'}
                    x1="140"
                    y1="11"
                    x2="140"
                    y2={i % 5 ? '16.5' : '21'}
                    transform={`rotate(${i * 6} 140 140)`}
                  />
                ))}
              </g>
              <circle className="ring-track" cx="140" cy="140" r={RING_R} />
              <circle
                className="ring-glow"
                cx="140"
                cy="140"
                r={RING_R}
                stroke="url(#ringGrad)"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - progress / 100)}
                transform="rotate(-90 140 140)"
              />
              <circle
                className="ring-progress"
                cx="140"
                cy="140"
                r={RING_R}
                stroke="url(#ringGrad)"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - progress / 100)}
                transform="rotate(-90 140 140)"
              />
            </svg>
            <div className="ring-center">
              <div className="time-display">{formatTime(secondsLeft)}</div>
              <div className="time-tag">
                <span className="tag-line" />
                {m.tag}
                <span className="tag-line" />
              </div>
            </div>
          </div>

          <div className="pomo-row">
            <div className="pips" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={i < cycleFilled ? 'pip on' : 'pip'} />
              ))}
            </div>
            <span className="pomo-text">
              Pomodoros na sessão · <strong>{String(pomodoroCount).padStart(2, '0')}</strong>
            </span>
          </div>

          <div className="actions">
            <button className={`btn-primary ${isActive ? 'running' : ''}`} onClick={() => setIsActive(!isActive)}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                {isActive ? (
                  <path d="M9 6v12M15 6v12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                ) : (
                  <path d="M8 5.6v12.8L19 12 8 5.6Z" fill="currentColor" />
                )}
              </svg>
              {isActive ? 'Pausar' : 'Iniciar'}
            </button>
            <button
              className="btn-reset"
              onClick={() => {
                setIsActive(false)
                setSecondsLeft(TIMES[mode])
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4.5 8.5A8 8 0 1 1 4 13.5M4.5 4v4.5H9"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Reiniciar
            </button>
          </div>
        </section>

        {/* Coluna analítica */}
        <aside className="side-col">
          <section className="panel stats-panel">
            <header className="panel-head">
              <h2>Análise de Foco</h2>
              <span className="head-chip">7 DIAS</span>
            </header>

            <div className="metric-grid">
              <div className="metric">
                <span className="metric-value cyan">{Math.round(todayMins)}<small>min</small></span>
                <span className="metric-label">Hoje</span>
              </div>
              <div className="metric">
                <span className="metric-value violet">{sessions.length}</span>
                <span className="metric-label">Sessões</span>
              </div>
              <div className="metric">
                <span className="metric-value magenta">{avgMins.toFixed(1)}<small>min</small></span>
                <span className="metric-label">Média</span>
              </div>
            </div>

            <div className="chart" role="img" aria-label="Minutos de foco por dia nos últimos 7 dias">
              {week.map((w, i) => (
                <div key={`${w.key}-${i}`} className="bar-slot" title={`${w.mins} min`}>
                  <div className="bar-zone">
                    <div
                      className={`bar ${i === week.length - 1 ? 'today' : ''}`}
                      style={{ height: `${Math.max((w.mins / maxDayMins) * 100, w.mins > 0 ? 6 : 2.5)}%` }}
                    />
                  </div>
                  <span className="bar-label">{w.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel log-panel">
            <header className="panel-head">
              <h2>Registro de Jornadas</h2>
              <span className="head-chip mono">{String(sessions.length).padStart(3, '0')}</span>
            </header>
            {sessions.length === 0 ? (
              <p className="log-empty">Nenhum registro. Complete um pomodoro para gravar a primeira jornada.</p>
            ) : (
              <ul className="log-list">
                {sessions.slice(0, 14).map((session, idx) => (
                  <li key={session.id} className="log-row">
                    <span className="log-id mono">#{String(sessions.length - idx).padStart(3, '0')}</span>
                    <span className="log-title">{cleanTitle(session.title)}</span>
                    <span className="log-meta">
                      <strong>{session.duration} min</strong> ·{' '}
                      {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </main>

      {/* Fila de tarefas */}
      <section className="panel tasks-panel">
        <header className="panel-head">
          <h2>Fila de Estudos</h2>
          <span className="head-chip">
            {tasks.filter((t) => t.completed).length}/{tasks.length} CONCLUÍDAS
          </span>
        </header>

        <form onSubmit={addTask} className="task-form">
          <input
            type="text"
            placeholder="Defina o próximo objetivo de estudo…"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <button type="submit" aria-label="Adicionar tarefa">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </button>
        </form>

        {tasks.length === 0 ? (
          <p className="tasks-empty">Nenhuma tarefa na fila. Cadastre seu primeiro alvo de estudo.</p>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id} className={task.completed ? 'done' : ''}>
                <button
                  className="task-check"
                  aria-label={task.completed ? 'Desfazer tarefa' : 'Concluir tarefa'}
                  onClick={() => toggleTask(task.id, task.completed)}
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12.5 10 17.5 19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <span className="task-title">{task.title}</span>
                <button className="task-delete" aria-label="Excluir tarefa" onClick={() => deleteTask(task.id)}>
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="foot mono">STUDYFLOW · AMBIENTE LAB v2.0 · ENLACE LOCAL SEGURO</footer>
    </div>
  )
}

export default App
