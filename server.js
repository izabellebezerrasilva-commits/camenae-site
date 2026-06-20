const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'camenae-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 horas
}));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Helper: ler dados
function lerDados() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// Helper: salvar dados
function salvarDados(dados) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(dados, null, 2), 'utf8');
}

// Middleware: verificar autenticação
function autenticado(req, res, next) {
  if (req.session && req.session.logado) return next();
  res.status(401).json({ erro: 'Não autorizado' });
}

// ==================
// ROTAS PÚBLICAS (API para o site)
// ==================

app.get('/api/dados', (req, res) => {
  const dados = lerDados();
  const { admin, ...publico } = dados;
  res.json(publico);
});

// ==================
// ROTAS DE AUTENTICAÇÃO
// ==================

app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  const dados = lerDados();
  if (email === dados.admin.email && senha === dados.admin.senha) {
    req.session.logado = true;
    req.session.email = email;
    res.json({ ok: true });
  } else {
    res.status(401).json({ erro: 'E-mail ou senha incorretos' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

app.get('/api/sessao', (req, res) => {
  res.json({ logado: !!(req.session && req.session.logado) });
});

// ==================
// ROTAS ADMIN — MEMBROS
// ==================

app.get('/api/admin/membros', autenticado, (req, res) => {
  res.json(lerDados().membros);
});

app.post('/api/admin/membros', autenticado, (req, res) => {
  const dados = lerDados();
  const novoId = dados.membros.length ? Math.max(...dados.membros.map(m => m.id)) + 1 : 1;
  const novo = { id: novoId, ...req.body };
  dados.membros.push(novo);
  salvarDados(dados);
  res.json(novo);
});

app.put('/api/admin/membros/:id', autenticado, (req, res) => {
  const dados = lerDados();
  const idx = dados.membros.findIndex(m => m.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ erro: 'Membro não encontrado' });
  dados.membros[idx] = { id: parseInt(req.params.id), ...req.body };
  salvarDados(dados);
  res.json(dados.membros[idx]);
});

app.delete('/api/admin/membros/:id', autenticado, (req, res) => {
  const dados = lerDados();
  dados.membros = dados.membros.filter(m => m.id !== parseInt(req.params.id));
  salvarDados(dados);
  res.json({ ok: true });
});

// ==================
// ROTAS ADMIN — PESQUISAS
// ==================

app.get('/api/admin/pesquisas', autenticado, (req, res) => {
  res.json(lerDados().pesquisas);
});

app.post('/api/admin/pesquisas', autenticado, (req, res) => {
  const dados = lerDados();
  const novoId = dados.pesquisas.length ? Math.max(...dados.pesquisas.map(p => p.id)) + 1 : 1;
  const novo = { id: novoId, ...req.body };
  dados.pesquisas.push(novo);
  salvarDados(dados);
  res.json(novo);
});

app.put('/api/admin/pesquisas/:id', autenticado, (req, res) => {
  const dados = lerDados();
  const idx = dados.pesquisas.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ erro: 'Pesquisa não encontrada' });
  dados.pesquisas[idx] = { id: parseInt(req.params.id), ...req.body };
  salvarDados(dados);
  res.json(dados.pesquisas[idx]);
});

app.delete('/api/admin/pesquisas/:id', autenticado, (req, res) => {
  const dados = lerDados();
  dados.pesquisas = dados.pesquisas.filter(p => p.id !== parseInt(req.params.id));
  salvarDados(dados);
  res.json({ ok: true });
});

// ==================
// ROTAS ADMIN — CONTATO E SOBRE
// ==================

app.put('/api/admin/contato', autenticado, (req, res) => {
  const dados = lerDados();
  dados.contato = { ...dados.contato, ...req.body };
  salvarDados(dados);
  res.json(dados.contato);
});

app.put('/api/admin/sobre', autenticado, (req, res) => {
  const dados = lerDados();
  dados.sobre = req.body.sobre;
  salvarDados(dados);
  res.json({ ok: true });
});

// ==================
// ROTAS ADMIN — SENHA
// ==================

app.put('/api/admin/senha', autenticado, (req, res) => {
  const { senhaAtual, novaSenha } = req.body;
  const dados = lerDados();
  if (senhaAtual !== dados.admin.senha) {
    return res.status(401).json({ erro: 'Senha atual incorreta' });
  }
  dados.admin.senha = novaSenha;
  salvarDados(dados);
  res.json({ ok: true });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Camenae rodando na porta ${PORT}`);
});
