import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')

  // Estados do Pomodoro Avançado
  const [mode, setMode] = useState('work') // 'work', 'shortBreak', 'longBreak'
  const [secondsLeft, setSecondsLeft] = useState(1500)
  const [isActive, setIsActive] = useState(false)
  const [pomodoroCount, setPomodoroCount] = useState(0)

  const TIMES = {
    work: 1500,
    shortBreak: 300,
    longBreak: 900
  }

  const COLORS = {
    work: '#4f46e5',
    shortBreak: '#10b981',
    longBreak: '#3b82f6'
  }

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

  // Lógica do Timer e Transição Automática
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

  // Cálculo da barra de progresso
  const totalTime = TIMES[mode]
  const progress = ((totalTime - secondsLeft) / totalTime) * 100

  // Requisições para o Backend (Tarefas)
  useEffect(() => {
    fetch('https://studyflow-rzyn.onrender.com/tasks')
      .then((res) => res.json())
      .then((data) => setTasks(data))
      .catch((err) => console.error('Erro ao buscar tarefas:', err))
  }, [])

  const addTask = (e) => {
    e.preventDefault()
    if (!newTask.trim()) return

    fetch('https://studyflow-rzyn.onrender.com/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTask }),
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

    fetch(`https://studyflow-rzyn.onrender.com/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: newCompleted }),
    })
      .then(() => {
        setTasks(tasks.map(task => task.id === id ? { ...task, completed: newCompleted } : task))
      })
      .catch((err) => console.error('Erro ao atualizar tarefa:', err))
  }

  const deleteTask = (id) => {
    fetch(`https://studyflow-rzyn.onrender.com/tasks/${id}`, {
      method: 'DELETE',
    })
      .then(() => {
        setTasks(tasks.filter(task => task.id !== id))
      })
      .catch((err) => console.error('Erro ao deletar tarefa:', err))
  }

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', color: COLORS[mode] }}>StudyFlow 📚🚀</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>Organize seus estudos e potencialize seu aprendizado</p>
      
      {/* Bloco do Pomodoro Aprimorado */}
      <div style={{ background: '#f8fafc', border: `2px solid ${COLORS[mode]}`, padding: '20px', borderRadius: '12px', textAlign: 'center', marginBottom: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        
        {/* Botões de Troca Manual de Modo */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '15px' }}>
          <button 
            onClick={() => switchMode('work')}
            style={{ padding: '6px 12px', background: mode === 'work' ? COLORS.work : '#e2e8f0', color: mode === 'work' ? '#fff' : '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Foco
          </button>
          <button 
            onClick={() => switchMode('shortBreak')}
            style={{ padding: '6px 12px', background: mode === 'shortBreak' ? COLORS.shortBreak : '#e2e8f0', color: mode === 'shortBreak' ? '#fff' : '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Pausa Curta
          </button>
          <button 
            onClick={() => switchMode('longBreak')}
            style={{ padding: '6px 12px', background: mode === 'longBreak' ? COLORS.longBreak : '#e2e8f0', color: mode === 'longBreak' ? '#fff' : '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Pausa Longa
          </button>
        </div>

        <div style={{ fontSize: '48px', fontWeight: 'bold', color: COLORS[mode], marginBottom: '10px' }}>
          {formatTime(secondsLeft)}
        </div>

        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '15px' }}>
          Pomodoros concluídos: <strong>{pomodoroCount}</strong>
        </p>

        {/* Barra de Progresso Visual */}
        <div style={{ width: '100%', background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ width: `${progress}%`, background: COLORS[mode], height: '100%', transition: 'width 1s linear' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button 
            onClick={() => setIsActive(!isActive)}
            style={{ padding: '10px 20px', background: isActive ? '#f59e0b' : COLORS[mode], color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
          >
            {isActive ? 'Pausar' : 'Iniciar'}
          </button>
          <button 
            onClick={() => { setIsActive(false); setSecondsLeft(TIMES[mode]); }}
            style={{ padding: '10px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
          >
            Reiniciar
          </button>
        </div>
      </div>

      <form onSubmit={addTask} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="O que você vai estudar hoje?"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          style={{ flex: 1, padding: '12px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '12px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
          Adicionar
        </button>
      </form>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {tasks.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>Nenhuma tarefa cadastrada ainda. Vamos começar?</p>
        ) : (
          tasks.map((task) => (
            <li key={task.id} style={{ background: '#f9f9f9', padding: '15px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <span 
                style={{ fontSize: '16px', color: task.completed ? '#888' : '#333', textDecoration: task.completed ? 'line-through' : 'none', flex: 1 }}
              >
                {task.title}
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => toggleTask(task.id, task.completed)}
                  style={{ padding: '6px 12px', background: task.completed ? '#e0e7ff' : '#10b981', color: task.completed ? '#3730a3' : '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  {task.completed ? 'Desfazer' : 'Concluir'}
                </button>
                <button 
                  onClick={() => deleteTask(task.id)}
                  style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Excluir
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

export default App