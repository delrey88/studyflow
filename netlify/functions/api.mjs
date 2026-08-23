import { getStore } from '@netlify/blobs'

const json = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
})

const emptyDb = () => ({ tasks: [], sessions: [], seq: { task: 0, session: 0 } })

// Roteador puro (mesmas rotas/semântica do Express original em server/server.js)
export function apply(db, method, rawPath, body = {}) {
  const path = String(rawPath || '/')
    .replace(/^\/\.netlify\/functions\/api/, '')
    .replace(/^\/api/, '')
  const segs = path.split('/').filter(Boolean)
  const [resource, idSeg] = segs

  if (resource === 'tasks') {
    if (method === 'GET' && !idSeg) {
      return json(200, [...db.tasks].sort((a, b) => a.id - b.id))
    }
    if (method === 'POST' && !idSeg) {
      const title = typeof body.title === 'string' ? body.title.trim() : ''
      if (!title) return json(400, { error: 'O título da tarefa é obrigatório!' })
      const task = { id: ++db.seq.task, title, completed: 0 }
      db.tasks.push(task)
      return json(200, task)
    }
    const task = db.tasks.find((t) => t.id === Number(idSeg))
    if (!task) return json(404, { error: 'Tarefa não encontrada!' })
    if (method === 'PUT') {
      task.completed = body.completed ? 1 : 0
      return json(200, { message: 'Tarefa atualizada com sucesso!' })
    }
    if (method === 'DELETE') {
      db.tasks = db.tasks.filter((t) => t.id !== task.id)
      return json(200, { message: 'Tarefa deletada com sucesso!' })
    }
  }

  if (resource === 'sessions') {
    if (method === 'GET' && !idSeg) {
      return json(200, [...db.sessions].sort((a, b) => b.id - a.id))
    }
    if (method === 'POST' && !idSeg) {
      const session = {
        id: ++db.seq.session,
        title: body.title || 'Sessão de Foco',
        duration: Number(body.duration) || 25,
        created_at: new Date().toISOString()
      }
      db.sessions.push(session)
      return json(200, session)
    }
  }

  return json(404, { error: 'Rota não encontrada!' })
}

export async function handler(event) {
  try {
    const store = getStore({ name: 'studyflow', consistency: 'strong' })
    const method = event.httpMethod
    const db = (await store.get('db', { type: 'json' })) ?? emptyDb()

    const body = event.body ? JSON.parse(event.body) : {}
    const res = apply(db, method, event.path, body)

    if (method !== 'GET' && res.statusCode < 400) {
      await store.setJSON('db', db)
    }
    return res
  } catch (err) {
    console.error('Erro na API:', err)
    return json(500, { error: 'Erro interno da API.' })
  }
}
