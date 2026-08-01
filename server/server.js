const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Conectando e criando o arquivo do banco de dados SQLite
const db = new sqlite3.Database('./studyflow.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao SQLite:', err.message);
  } else {
    console.log('📦 Conectado ao banco de dados SQLite com sucesso!');
  }
});

// Criando a tabela de tarefas (se ela ainda não existir)
db.run(`CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT 0
)`, (err) => {
  if (!err) {
    console.log('Tabela "tasks" pronta para uso.');
  }
});

// Criando a tabela de sessões de estudo (Pomodoro)
db.run(`CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  duration INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
  if (!err) {
    console.log('Tabela "sessions" pronta para uso.');
  }
});

// Rota padrão de teste
app.get('/', (req, res) => {
  res.json({ message: "API do StudyFlow rodando com sucesso! 🚀" });
});

// 1. ROTA PARA LISTAR TODAS AS TAREFAS (GET)
app.get('/tasks', (req, res) => {
  db.all('SELECT * FROM tasks', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 2. ROTA PARA CRIAR UMA NOVA TAREFA (POST)
app.post('/tasks', (req, res) => {
  const { title } = req.body;
  if (!title) {
    res.status(400).json({ error: 'O título da tarefa é obrigatório!' });
    return;
  }

  const sql = 'INSERT INTO tasks (title, completed) VALUES (?, 0)';
  db.run(sql, [title], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      id: this.lastID,
      title: title,
      completed: 0
    });
  });
});

// 3. ROTA PARA ATUALIZAR O STATUS DA TAREFA (PUT)
app.put('/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;

  const sql = 'UPDATE tasks SET completed = ? WHERE id = ?';
  db.run(sql, [completed, id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Tarefa atualizada com sucesso!' });
  });
});

// 4. ROTA PARA DELETAR UMA TAREFA (DELETE)
app.delete('/tasks/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'DELETE FROM tasks WHERE id = ?';
  db.run(sql, [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Tarefa deletada com sucesso!' });
  });
});

// --- NOVAS ROTAS PARA AS SESSÕES (POMODORO) ---

// 5. ROTA PARA LISTAR O HISTÓRICO DE SESSÕES (GET)
app.get('/sessions', (req, res) => {
  db.all('SELECT * FROM sessions ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 6. ROTA PARA REGISTRAR UMA SESSÃO CONCLUÍDA (POST)
app.post('/sessions', (req, res) => {
  const { title, duration } = req.body;
  const sessionTitle = title || 'Sessão de Foco';
  const sessionDuration = duration || 25;

  const sql = 'INSERT INTO sessions (title, duration) VALUES (?, ?)';
  db.run(sql, [sessionTitle, sessionDuration], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      id: this.lastID,
      title: sessionTitle,
      duration: sessionDuration
    });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});