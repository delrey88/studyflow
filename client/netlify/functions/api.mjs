import { getStore, connectLambda } from '@netlify/blobs'

const json = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
})

// Roteador puro (mesmas rotas/semântica do Express original em server/server.js)
// Armazenamento: uma chave por item ("task:<id>" / "session:<id>") — mutações
// são autoritativas na origem, sem depender de visões em cache.
export async function apply(store, method, rawPath, body = {}) {
  const path = String(rawPath || '/')
    .replace(/^\/\.netlify\/functions\/api/, '')
    .replace(/^\/api/, '')
  const segs = path.split('/').filter(Boolean)
  const [resource, idSeg] = segs

  if (resource === 'tasks') {
    if (method === 'GET' && !idSeg) {
      const { blobs } = await store.list({ prefix: 'task:' })
      const items = await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })))
      return json(200, items.filter(Boolean).sort((a, b) => a.id - b.id))
    }
    if (method === 'POST' && !idSeg) {
      const title = typeof body.title === 'string' ? body.title.trim() : ''
      if (!title) return json(400, { error: 'O título da tarefa é obrigatório!' })
      const task = { id: Date.now(), title, completed: 0 }
      await store.setJSON(`task:${task.id}`, task)
      return json(200, task)
    }
    const key = `task:${Number(idSeg)}`
    if (method === 'PUT') {
      const task = await store.get(key, { type: 'json' })
      if (!task) return json(200, { message: 'Tarefa atualizada com sucesso!' })
      task.completed = body.completed ? 1 : 0
      await store.setJSON(key, task)
      return json(200, { message: 'Tarefa atualizada com sucesso!' })
    }
    if (method === 'DELETE') {
      await store.delete(key)
      return json(200, { message: 'Tarefa deletada com sucesso!' })
    }
  }

  if (resource === 'sessions') {
    if (method === 'GET' && !idSeg) {
      const { blobs } = await store.list({ prefix: 'session:' })
      const items = await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })))
      return json(200, items.filter(Boolean).sort((a, b) => b.id - a.id))
    }
    if (method === 'POST' && !idSeg) {
      const session = {
        id: Date.now(),
        title: body.title || 'Sessão de Foco',
        duration: Number(body.duration) || 25,
        created_at: new Date().toISOString()
      }
      await store.setJSON(`session:${session.id}`, session)
      return json(200, session)
    }
  }

  return json(404, { error: 'Rota não encontrada!' })
}

export async function handler(event) {
  try {
    connectLambda(event)
    const store = getStore('studyflow')
    const method = event.httpMethod
    const body = event.body ? JSON.parse(event.body) : {}
    return await apply(store, method, event.path, body)
  } catch (err) {
    console.error('Erro na API:', err)
    return json(500, { error: 'Erro interno da API.', detail: String((err && err.message) || err) })
  }
}
