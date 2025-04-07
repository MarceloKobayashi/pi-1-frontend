document.addEventListener("DOMContentLoaded", async () => {
    const barraPesquisa = document.querySelector(".barra-pesquisa");
    const filtroCategoria = document.querySelector(".filtro-categoria");
    const btnFiltro = document.querySelector(".btn-filtro");
    const produtosContainer = document.getElementById("produtos-por-categoria");
    const loading = document.getElementById("loading");
    const btnCarrinho = document.querySelector(".btn-header:last-child");

    let produtos = [];
    let categorias = [];

    await init();

    async function init() {
        try {
            await Promise.all([carregarCategorias(), carregarProdutos()]);
            renderizarProdutos();
        } catch (error) {
            console.error("Erro na inicialização: ", error);
            loading.textContent = "Eror ao carregar dados. Tente recarregar a página.";
        }
    }

    async function carregarCategorias() {
        try {
            const response = await fetch("http://localhost:8000/produtos/categorias");
            if (!response.ok) throw new Error("Erro ao carregar categorias.");
            
            categorias = await response.json();
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id;
                option.textContent = categoria.nome;
                filtroCategoria.appendChild(option);
            });
        } catch (error) {
            console.error("Erro em carregar categorias: ", error);
            throw error;
        }
    }

    async function carregarProdutos() {
        try {
            loading.style.display = 'block';
            produtosContainer.innerHTML = '';

            let url = 'http://localhost:8000/index/listar';
            const categoriaId = filtroCategoria.value;
            const termoPesquisa = barraPesquisa.value.trim();

            const params = new URLSearchParams();
            if (categoriaId) params.append('categoria_id', categoriaId);
            if (termoPesquisa) params.append('nome', termoPesquisa);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error("Erro ao carregar produtos.");

            produtos = await response.json();
        } catch (error) {
            console.error("Erro ao carregar produtos: ", error);
            produtosContainer.innerHTML = '<p class="erro">Erro ao carregar produtos. Tente recarregar a página.</p>';
            throw error;
        } finally {
            loading.style.display = 'none';
        }
    }

    function renderizarProdutos() {
        produtosContainer.innerHTML = '';

        if (produtos.length === 0) {
            produtosContainer.innerHTML = '<p class="sem-produtos">Nenhum produto encontrado.</p>';
            return;
        }

        const produtosPorCategoria = {};
        produtos.forEach(produto => {
            const categoriaId = produto.fk_produtos_categoria_id;
            const categoriaNome = categorias.find(e => e.id === categoriaId)?.nome || 'Outros';

            if (!produtosPorCategoria[categoriaId]) {
                produtosPorCategoria[categoriaId] = {
                    nome: categoriaNome,
                    produtos: []
                };
            }

            produtosPorCategoria[categoriaId].produtos.push(produto);
        });

        for (const [categoriaId, data] of Object.entries(produtosPorCategoria)) {
            const section = document.createElement('section');
            section.className = 'categoria-section';
            section.innerHTML = `
                <h2 class="categoria-title">${data.nome}</h2>
                <div class="produtos-grid" id="categoria-${categoriaId}"></div>
            `;

            const grid = section.querySelector(`#categoria-${categoriaId}`);

            data.produtos.forEach(produto => {
                const imagemUrl = produto.imagens && produto.imagens.length > 0
                    ? produto.imagens[0].url_img
                    : 'https://via.placeholder.com/300x200?text=Sem+Imagem';
                
                const card = document.createElement('div');
                card.className = 'produto-card';
                card.innerHTML = `
                    <div class="produto-imagem" style="background-image: url('${imagemUrl}')"></div>
                    <div class="produto-info">
                        <div class="produto-header">
                            <h3>${produto.nome}</h3>
                            <span class="vendedor-info">Vendido por: ${produto.vendedor_nome}</span>
                        </div>
                        <p class="produto-descricao">${produto.descricao || "Sem descrição"}</p>
                        <div class="produto-footer">
                            <div class="produto-preco">R$ ${produto.preco.toFixed(2)}</div>
                        </div>
                        <button class="btn-adicionar-carrinho" data-id="${produto.id}">Adicionar ao Carrinho</button>
                    </div>
                `;
                
                grid.appendChild(card);
            });
            
            produtosContainer.appendChild(section);
        }
    }

    btnFiltro.addEventListener('click', async() => {
        await carregarProdutos();
        renderizarProdutos();
    });

    barraPesquisa.addEventListener('keypress', async(e) => {
        if (e.key == 'Enter') {
            await carregarProdutos();
            renderizarProdutos();
        }
    });

    btnCarrinho.addEventListener('click', () => {
        alert("Ir para carrinho");
    });

    //produtosContainer.addEventListener('click', (e) => {
        //if (e.target.classList.contains('btn-adicionar-carrinho')) {
          //  const produtoId = e.target.getAttribute('data-id');
        //    adicionarAoCarrinho(produtoId);
      //  }
    //});
});