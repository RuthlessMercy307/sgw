// DELIVERY SYSTEM CON FUNCIONALIDAD DE EDICIÓN DE COMANDAS

let itensSelecionados = [];
let menu = {};
let modoEdicion = false;
let indiceEdicion = null;
let comandasCache = [];

async function cargarMenu() {
  try {
    const res = await fetch("menu.json");
    if (!res.ok) throw new Error("No se pudo cargar menu.json");
    menu = await res.json();
    renderizarProdutos();
  } catch (err) {
    console.error("Erro ao carregar o menu:", err);
    document.getElementById('lista-produtos').innerHTML = `<p style="color:red;">Erro ao carregar o menu.</p>`;
  }
}

function renderizarProdutos() {
  const div = document.getElementById('lista-produtos');
  if (!div) return;
  div.innerHTML = '';
  Object.entries(menu).forEach(([nome, preco]) => {
    const item = document.createElement('div');
    item.className = 'produto';
    item.innerHTML = `
      ${nome} – R$ ${preco.toFixed(2)}
      <span>
          <button onclick="adicionarComProduto('${nome}')"><i class="fas fa-plus"></i></button>
          <button onclick="remover('${nome}')"><i class="fas fa-minus"></i></button>
      </span>
    `;
    div.appendChild(item);
  });
}

function atualizarComanda() {
  const ul = document.getElementById('itens-selecionados');
  if (!ul) return;
  ul.innerHTML = '';
  let total = 0;

  itensSelecionados.forEach((item, i) => {
    total += item.preco;
    const li = document.createElement('li');
    li.innerHTML = `
      <div style="margin-bottom: 6px;">
        <strong>${item.nome}</strong> — R$ ${item.preco.toFixed(2)}<br>
        ${item.obs ? `<em style="font-size: 0.9em; color: #444;">Obs: ${item.obs}</em><br>` : ''}
        <button onclick="removerPorIndice(${i})" style="margin-top: 2px;">Remover</button>
      </div>
    `;
    ul.appendChild(li);
  });

  const totalEl = document.getElementById('total');
  if (totalEl) totalEl.textContent = `Total: R$ ${total.toFixed(2)}`;
}

function adicionarComProduto(nome) {
  const preco = menu[nome];
  const obs = prompt(`Observação para "${nome}" (opcional):`);
  itensSelecionados.push({ nome, preco, obs: obs || null });
  atualizarComanda();
}

function adicionar(nome) {
  const preco = menu[nome];
  itensSelecionados.push({ nome, preco });
  atualizarComanda();
}

function remover(nome) {
  const index = itensSelecionados.findIndex(i => i.nome === nome);
  if (index !== -1) {
    itensSelecionados.splice(index, 1);
    atualizarComanda();
  }
}

function removerPorIndice(index) {
  itensSelecionados.splice(index, 1);
  atualizarComanda();
}

async function salvarComanda() {
  const form = document.getElementById('pedido-form');
  if (!form) return;

  const numero = form.numero.value.trim();
  const cliente = form.cliente.value.trim();
  const telefone = form.telefone.value.trim();
  const endereco = form.endereco.value.trim();
  const observacoes = form.observacoes.value.trim();
  const pagamento = form.pagamento.value.trim();
  const delivery = parseFloat(form.delivery.value);
  const troco = parseFloat(form.troco.value) || null;

  if (!cliente || !telefone || itensSelecionados.length === 0) {
    alert('Preencha todos os campos obrigatórios e adicione ao menos um item.');
    return;
  }

  const total = itensSelecionados.reduce((acc, item) => acc + item.preco, 0) + delivery;

  const comanda = {
    numero,
    data: new Date().toLocaleString('pt-BR'),
    cliente,
    telefone,
    endereco,
    observacoes,
    pagamento,
    delivery,
    troco,
    total,
    items: [...itensSelecionados]
  };

  if (modoEdicion) {
    comandasCache[indiceEdicion] = comanda;
    await fetch('/editar-pedido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index: indiceEdicion, comanda })
    });
  } else {
    await fetch('/novo-pedido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comanda)
    });
  }

  form.reset();
  itensSelecionados.length = 0;
  modoEdicion = false;
  atualizarComanda();
  carregarComandas();
}

async function carregarComandas() {
  const res = await fetch('/pedidos');
  const pedidos = await res.json();
  comandasCache = pedidos;
  const div = document.getElementById('comandas');
  if (!div) return;

  div.innerHTML = '';
  pedidos.slice().reverse().forEach((p, i) => {
    const realIndex = pedidos.length - 1 - i;
    const html = p.items.map(x => `
      <li>
        ${x.nome} — R$ ${x.preco.toFixed(2)}
        ${x.obs ? `<br><small><i>Obs: ${x.obs}</i></small>` : ''}
      </li>`).join('');

    const box = document.createElement('div');
    box.className = 'comanda';
    box.id = 'comanda-' + realIndex;
    box.innerHTML = `
      <strong>Comanda ${p.numero}</strong><br>
      Data: ${p.data}<br>
      Cliente: ${p.cliente}<br>
      ${p.endereco ? `Endereço: ${p.endereco}<br>` : ''}
      Telefone: ${p.telefone}<br>
      Pagamento: ${p.pagamento}<br>
      Delivery: R$ ${p.delivery.toFixed(2)}<br>
      Observações: ${p.observacoes || 'Nenhuma'}<br>
      <ul>${html}</ul>
      <strong>Total: R$ ${p.total.toFixed(2)}</strong><br>
      ${p.troco ? `<strong>Troco pra ${p.troco.toFixed(2)}R$</strong><br>` : ''}
      <br>
      <button onclick="imprimirComanda(${realIndex})">Imprimir</button>
      <button onclick="editarComanda(${realIndex})">Editar</button>
    `;
    div.appendChild(box);
  });
}

function editarComanda(index) {
  const p = comandasCache[index];
  if (!p) return;

  const form = document.getElementById('pedido-form');
  form.numero.value = p.numero;
  form.cliente.value = p.cliente;
  form.telefone.value = p.telefone;
  form.endereco.value = p.endereco;
  form.observacoes.value = p.observacoes;
  form.pagamento.value = p.pagamento;
  form.delivery.value = p.delivery;
  form.troco.value = p.troco || '';

  itensSelecionados = [...p.items];
  modoEdicion = true;
  indiceEdicion = index;
  atualizarComanda();
}

function getFechaHoy() {
  const ahora = new Date();
  if (ahora.getHours() < 3) {
    ahora.setDate(ahora.getDate() - 1);
  }
  return ahora.toISOString().split("T")[0];
}

async function obtenerNumeroComanda() {
  const res = await fetch('/pedidos');
  const pedidos = await res.json();
  const hoy = getFechaHoy();
  const pedidosDeHoy = pedidos.filter(p => {
    const fecha = new Date(p.data);
    if (fecha.getHours() < 3) fecha.setDate(fecha.getDate() - 1);
    return fecha.toISOString().split("T")[0] === hoy;
  });
  const numero = pedidosDeHoy.length + 1;
  return numero.toString().padStart(2, "0");
}

// Inicialización al cargar delivery.html directamente
if (document.getElementById('lista-produtos')) {
  cargarMenu();
  carregarComandas().then(() => {
    const campoNumero = document.querySelector('#pedido-form input[name="numero"]');
    if (campoNumero && !campoNumero.value) {
      obtenerNumeroComanda().then(n => campoNumero.value = n);
    }
  });
}

// EXPONER PARA BOTONES
window.adicionar = adicionar;
window.adicionarComProduto = adicionarComProduto;
window.remover = remover;
window.removerPorIndice = removerPorIndice;
window.salvarComanda = salvarComanda;
window.carregarComandas = carregarComandas;
window.editarComanda = editarComanda;

window.imprimirComanda = function (index) {
  // función auxiliar para cortar texto sin romper palabras
  function dividirTexto(texto, limite) {
    const palavras = texto.split(' ');
    const linhas = [];
    let linhaAtual = '';

    for (const palavra of palavras) {
      if ((linhaAtual + ' ' + palavra).trim().length > limite) {
        linhas.push(linhaAtual.trim());
        linhaAtual = palavra;
      } else {
        linhaAtual += ' ' + palavra;
      }
    }

    if (linhaAtual) linhas.push(linhaAtual.trim());
    return linhas.join('\n');
  }

  fetch('/pedidos')
    .then(res => res.json())
    .then(pedidos => {
      const p = pedidos[index];
      const htmlItens = p.items.map(x => {
        let linha = `${x.nome} – R$ ${x.preco.toFixed(2)}`;
        if (x.obs) linha += `\nObs: ${x.obs}`;
        return linha;
      }).join('\n');

      const conteudo = `
GOLDEN WOK - DELIVERY

Comanda ${p.numero}
Data: ${p.data}
Cliente: ${p.cliente}
${p.endereco ? `Endereço:\n${dividirTexto(p.endereco, 20)}` : ''}
Telefone: ${p.telefone}
Pagamento: ${p.pagamento}
Delivery: R$ ${p.delivery.toFixed(2)}
Observações: ${p.observacoes || 'Nenhuma'}

${htmlItens}

Total: R$ ${p.total.toFixed(2)}
${p.troco ? `Troco pra ${p.troco.toFixed(2)}R$` : ''}
      `;

      const win = window.open('', '', 'width=300,height=800');
      win.document.write(`
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Comanda – Golden Wok</title>
          <style>
            @page { size: 58mm auto; margin: 0; }
            body { margin: 0; padding: 0; font-family: monospace; white-space: pre; }
          </style>
        </head>
        <body>
${conteudo}
<script>
  setTimeout(() => {
    window.print();
    window.close();
  }, 200);
</script>
        </body>
        </html>
      `);
      win.document.close();
    });
};

