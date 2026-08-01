# StudyFlow 📚🚀

O **StudyFlow** é uma aplicação Full Stack desenvolvida para ajudar estudantes a organizarem suas rotinas de estudos, gerenciarem tarefas pendentes e manterem o foco com um **Método Pomodoro Avançado** e histórico de sessões persistido na nuvem.

## ✨ Funcionalidades

* **Gerenciamento de Tarefas:** Adicione, marque como concluída ou exclua tarefas de estudo facilmente.
* **🍅 Método Pomodoro Avançado:** 
  * Ciclo completo seguindo o padrão original: Foco (25 min) ➔ Pausa Curta (5 min) ➔ Pausa Longa (15 min a cada 4 pomodoros).
  * Transição automática entre os modos e contador de pomodoros concluídos em tempo real.
  * Notificações do navegador e alertas sonoros discretos via Web Audio API.
  * Barra de progresso visual e alteração dinâmica de cores conforme o modo ativo.
  * Botões de controle manual (Foco / Pausa Curta / Pausa Longa) e ajuste inteligente do botão Reiniciar.
* **📊 Histórico de Sessões:** Registro e persistência em banco de dados de todas as jornadas de foco concluídas com sucesso.
* **Persistência Completa:** Tarefas e histórico salvos com segurança utilizando SQLite no backend.

## 🛠️ Tecnologias Utilizadas

* **Frontend:** React, Vite, JavaScript, CSS (Hospedado no Netlify)
* **Backend:** Node.js, Express, SQLite (`sqlite3`) (Hospedado no Render)
* **Controle de Versão:** Git e GitHub

## 🌐 Acesso Online
* **Aplicação (Frontend):** [studyflow-delrey.netlify.app](https://studyflow-delrey.netlify.app/)
* **API (Backend):** [studyflow-rzyn.onrender.com](https://studyflow-rzyn.onrender.com/)