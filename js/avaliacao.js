const listaAvaliacoesEl = document.getElementById("lista-avaliacoes");
const btnNovaAvaliacao = document.getElementById("btn-nova-avaliacao");
const avaliacaoModal = document.getElementById("avaliacao-modal");
const formAvaliacao = document.getElementById("form-avaliacao");

const produtoBuscaInput = document.getElementById("produto-busca");
const produtoListaSelect = document.getElementById("produto-lista");
const notaInput = document.getElementById("nota");
const comentarioInput = document.getElementById("comentario");
const btnCancelar = document.getElementById("btn-cancelar");

let produtosDisponiveis = [];
const API_BASE = "http://localhost:8000";
const token = localStorage.getItem("token");

async function authFetch(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || res.statusText);
  }
  return res.json();
}

async function carregarAvaliacoesUsuario() {
    listaAvaliacoesEl.innerHTML = `<div class="loading">Carregando avaliações...</div>`;
    try {
        const avaliacoes = await authFetch(`${API_BASE}/avaliacao/usuario`);
        if (avaliacaoModal.length === 0) {
            listaAvaliacoesEl.innerHTML = '<p>Nenhuma avaliação encontrada.</p>';
            return;
        }

        const produtos = await Promise.all(
            avaliacoes.map(av => 
                authFetch(`${API_BASE}/produtos/produto/${av.fk_ava_produto_id}`).catch(() => null)
            )
        );

        listaAvaliacoesEl.innerHTML = avaliacoes.map((av, index) => {
            const produto = produtos[index];
            const imagemUrl = produto?.imagem_url 
                ? `${API_BASE}/static/${produto.imagem_url}`
                : 'https://via.placeholder.com/100x100?text=Sem+imagem';
            
            return `
                <div class="avaliacao-item">
                    <div class="avaliacao-imagem">
                        <img src="${imagemUrl}" alt="Imagem do produto" 
                             onerror="this.src='https://via.placeholder.com/100x100?text=Imagem+não+disponível'">
                    </div>
                    <div class="avaliacao-conteudo">
                        <h3>${produto?.nome || `Produto ID: ${av.fk_ava_produto_id}`}</h3>
                        <div class="avaliacao-nota">
                            ${'★'.repeat(av.nota)}${'☆'.repeat(5 - av.nota)}
                        </div>
                        <p class="avaliacao-comentario">${av.comentario || "<i>Sem comentário</i>"}</p>
                        <small class="avaliacao-data"><em>${new Date(av.data_avaliacao).toLocaleString()}</em></small>
                    </div>
                </div>
            `;
        }).join("");
    } catch (error) {
        listaAvaliacoesEl.innerHTML = `<p class="error">Erro ao carregar avaliações: ${error.message}</p>`;
    }
}

async function buscarProdutos(query = "", pagina = 1, limite = 12) {
  try {
    const url = new URL(`${API_BASE}/index/listar`);
    if (query) url.searchParams.append("nome", query);
    url.searchParams.append("pagina", pagina);
    url.searchParams.append("limite", limite);

    produtosDisponiveis = await authFetch(url.toString());
    atualizarListaProdutos(produtosDisponiveis);
  } catch (error) {
    produtoListaSelect.innerHTML = `<option disabled>Erro ao buscar produtos</option>`;
  }
}

// Atualiza o <select> com os produtos filtrados
function atualizarListaProdutos(produtos) {
  if (produtos.length === 0) {
    produtoListaSelect.innerHTML = `<option disabled>Nenhum produto encontrado</option>`;
    return;
  }
  produtoListaSelect.innerHTML = produtos.map(p => 
    `<option value="${p.id}">${p.nome}</option>`
  ).join("");
}

// Ao digitar no campo de busca, busca produtos com debounce
let debounceTimeout;
produtoBuscaInput.addEventListener("input", () => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    buscarProdutos(produtoBuscaInput.value.trim());
  }, 300);
});

// Abrir modal nova avaliação
btnNovaAvaliacao.addEventListener("click", () => {
  produtoBuscaInput.value = "";
  notaInput.value = "";
  comentarioInput.value = "";
  produtoListaSelect.innerHTML = "";
  produtosDisponiveis = [];
  avaliacaoModal.showModal();
  buscarProdutos(); // carregar produtos sem filtro para iniciar
});

// Cancelar modal
btnCancelar.addEventListener("click", () => {
  avaliacaoModal.close();
});

// Enviar nova avaliação
formAvaliacao.addEventListener("submit", async e => {
  e.preventDefault();

  const produtoId = produtoListaSelect.value;
  const nota = Number(notaInput.value);
  const comentario = comentarioInput.value.trim();

  if (!produtoId) {
    alert("Selecione um produto.");
    return;
  }
  if (nota < 1 || nota > 5) {
    alert("Nota deve ser entre 1 e 5.");
    return;
  }

  const payload = {
    nota,
    comentario: comentario || null,
  };

  try {
    await authFetch(`${API_BASE}/avaliacao/registrar/${produtoId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    alert("Avaliação criada com sucesso!");
    avaliacaoModal.close();
    carregarAvaliacoesUsuario();
  } catch (error) {
    alert(`Erro ao criar avaliação: ${error.message}`);
  }
});

// Inicializa a página carregando avaliações
carregarAvaliacoesUsuario();