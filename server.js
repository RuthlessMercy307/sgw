// server.js corrigido e limpo (sem duplicações)

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(express.json());

const pastaComandas = path.join(__dirname, 'comandas');
const caminhoMenu = path.join(__dirname, 'public', 'menu.json');
const caminhoGastos = path.join(__dirname, 'public', 'gastos.json');

// 🔁 Função de data lógica (até as 3h é considerado dia anterior)
function getDataLogica() {
  const agora = new Date();
  if (agora.getHours() < 3) agora.setDate(agora.getDate() - 1);
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const ano = agora.getFullYear();
  return { ano, mes, dia, nomeArquivo: `${ano}-${mes}-${dia}` };
}

// 🔽 GET /pedidos — retorna pedidos do dia lógico
app.get('/pedidos', (req, res) => {
  const { nomeArquivo } = getDataLogica();
  const caminho = path.join(pastaComandas, `${nomeArquivo}.json`);

  if (!fs.existsSync(caminho)) return res.json([]);

  try {
    const pedidos = JSON.parse(fs.readFileSync(caminho, 'utf-8'));
    res.json(pedidos);
  } catch (err) {
    console.error("Erro ao ler pedidos:", err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// 🔽 GET /comandas/:data.json — retorna pedidos de um dia específico
app.get('/comandas/:data.json', (req, res) => {
  const data = req.params.data;
  const caminho = path.join(pastaComandas, `${data}.json`);

  if (!fs.existsSync(caminho)) return res.status(404).json({ error: 'Não encontrado' });

  try {
    const pedidos = JSON.parse(fs.readFileSync(caminho, 'utf-8'));
    res.json(pedidos);
  } catch (err) {
    console.error("Erro ao ler pedidos por data:", err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// 🔼 POST /novo-pedido — salva nova comanda
app.post('/novo-pedido', (req, res) => {
  const { ano, mes, dia, nomeArquivo } = getDataLogica();
  const caminhoJSON = path.join(pastaComandas, `${nomeArquivo}.json`);

  let dadosDia = [];
  if (fs.existsSync(caminhoJSON)) {
    try {
      dadosDia = JSON.parse(fs.readFileSync(caminhoJSON, 'utf-8'));
    } catch (e) {
      console.error("Erro ao ler JSON existente:", e);
    }
  }

  let pedido = req.body;
  if (!pedido.numero || pedido.numero === "01") {
    const novoNumero = String(dadosDia.length + 1).padStart(2, "0");
    pedido.numero = novoNumero;
  }

  dadosDia.push(pedido);
  if (!fs.existsSync(pastaComandas)) fs.mkdirSync(pastaComandas);
  fs.writeFileSync(caminhoJSON, JSON.stringify(dadosDia, null, 2));

  res.json({ success: true });
});

// ✏️ POST /editar-pedido — edita pedido existente
app.post('/editar-pedido', (req, res) => {
  const { index, comanda } = req.body;
  const { nomeArquivo } = getDataLogica();
  const caminho = path.join(pastaComandas, `${nomeArquivo}.json`);

  if (!fs.existsSync(caminho)) return res.status(404).json({ error: 'Arquivo não encontrado' });

  try {
    const pedidos = JSON.parse(fs.readFileSync(caminho, 'utf-8'));
    pedidos[index] = comanda;
    fs.writeFileSync(caminho, JSON.stringify(pedidos, null, 2));
    res.json({ success: true });
  } catch (e) {
    console.error('Erro ao editar comanda:', e);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// 📦 GET /menu.json — retorna o menu
app.get('/menu.json', (req, res) => {
  if (!fs.existsSync(caminhoMenu)) return res.status(404).json({ error: 'Menu não encontrado' });

  try {
    const data = fs.readFileSync(caminhoMenu, 'utf-8');
    res.json(JSON.parse(data));
  } catch (e) {
    console.error('Erro ao ler menu.json:', e);
    res.status(500).json({ error: 'Erro ao ler o menu' });
  }
});

// 📦 POST /salvar-menu — salva alterações do menu
app.post('/salvar-menu', (req, res) => {
  const novoMenu = req.body;
  if (!novoMenu || typeof novoMenu !== 'object') return res.status(400).json({ error: 'Formato inválido' });

  try {
    fs.writeFileSync(caminhoMenu, JSON.stringify(novoMenu, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (e) {
    console.error('Erro ao salvar menu.json:', e);
    res.status(500).json({ error: 'Erro ao salvar o menu' });
  }
});

// 💸 POST /gasto — registra novo gasto
app.post('/gasto', (req, res) => {
  const { valor, motivo, tipo } = req.body;
  if (typeof valor !== 'number' || !motivo || !tipo) return res.status(400).json({ error: 'Dados inválidos' });

  const gasto = {
    valor,
    motivo,
    tipo,
    data: new Date().toLocaleString('pt-BR')
  };

  let lista = [];
  if (fs.existsSync(caminhoGastos)) {
    try {
      lista = JSON.parse(fs.readFileSync(caminhoGastos, 'utf-8'));
    } catch (e) {
      console.error('Erro ao ler gastos:', e);
    }
  }

  lista.push(gasto);
  fs.writeFileSync(caminhoGastos, JSON.stringify(lista, null, 2));
  res.json({ success: true });
});

// 💸 GET /gastos — retorna lista de gastos
app.get('/gastos', (req, res) => {
  if (!fs.existsSync(caminhoGastos)) return res.json([]);

  try {
    const lista = JSON.parse(fs.readFileSync(caminhoGastos, 'utf-8'));
    res.json(lista);
  } catch (e) {
    console.error('Erro ao ler gastos:', e);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// 🟢 Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});