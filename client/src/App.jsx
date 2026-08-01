import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')

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
      <h1 style={{ textAlign: 'center', color: '#4f46e5' }}>StudyFlow 📚🚀</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>Organize seus estudos e potencialize seu aprendizado</p>
      
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