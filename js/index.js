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
        atualizarBotaoLogin();

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
                option.textContent = categoria.nome.charAt(0).toUpperCase() + categoria.nome.slice(1).toLowerCase();
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
                <h2 class="categoria-title">${data.nome.charAt(0).toUpperCase() + data.nome.slice(1).toLowerCase()}</h2>
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

    // Dialog de Produto
    const dialogImagemPrincipal = document.getElementById('dialog-imagem-principal');
    const miniaturasContainer = document.getElementById('miniaturas-container');

    let produtoAtual = null;
    let indiceImagemAtual = 0;

    produtosContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.produto-card');
        if (card) {
            const produtoId = parseInt(card.querySelector('.btn-adicionar-carrinho').getAttribute('data-id'));
        
            produtoAtual = produtos.find(p => p.id === produtoId);
            if (!produtoAtual) return;

            indiceImagemAtual = 0;

            document.getElementById('dialog-nome').textContent = produtoAtual.nome;
            document.getElementById('dialog-vendedor').textContent = `Vendido por: ${produtoAtual.vendedor_nome}`;
            document.getElementById('dialog-descricao').textContent = produtoAtual.descricao || "Sem descrição";
            document.getElementById('dialog-preco').textContent = `R$ ${produtoAtual.preco.toFixed(2)}`;
            document.getElementById('dialog-btn-carrinho').setAttribute('data-id', produtoAtual.id);

            const estoqueAlerta = document.getElementById('estoque-alerta');
            const estoqueEsgotado = document.getElementById('estoque-esgotado');

            estoqueAlerta.style.display = 'none';
            estoqueEsgotado.style.display = 'none';

            if (produtoAtual.qntd_estoque === 0) {
                estoqueEsgotado.style.display = 'block';
                document.getElementById('dialog-btn-carrinho').disabled = true;
                document.getElementById('dialog-btn-carrinho').style.backgroundColor = '#9e9e9e';
            } else if (produtoAtual.qntd_estoque <= 10) {
                estoqueAlerta.textContent = `Últimas unidades! Apenas ${produtoAtual.qntd_estoque} em estoque.`;
                estoqueAlerta.style.display = 'block';
                document.getElementById('dialog-btn-carrinho').disabled = false;
            } else {
                document.getElementById('dialog-btn-carrinho').disabled = false;
            }

            carregarImagensDialog();
            
            document.getElementById('produto-dialog').showModal();
        }
    });

    function carregarImagensDialog() {
        miniaturasContainer.innerHTML = '';
        
        if (!produtoAtual.imagens || produtoAtual.imagens.length === 0) {
            dialogImagemPrincipal.src = 'https://via.placeholder.com/600x400?text=Sem+Imagem';
            return;
        }

        dialogImagemPrincipal.src = produtoAtual.imagens[indiceImagemAtual].url_img;

        produtoAtual.imagens.forEach((img, index) => {
            const miniatura = document.createElement('img');
            miniatura.src = img.url_img;
            miniatura.alt = `Imagem ${index + 1} do Produto`;

            if (index === indiceImagemAtual) {
                miniatura.classList.add('ativo');
            }

            miniatura.addEventListener('click', () => {
                indiceImagemAtual = index;
                atualizarImagemDialog();
            });

            miniaturasContainer.appendChild(miniatura);
        });
    }

    function atualizarImagemDialog() {
        dialogImagemPrincipal.src = produtoAtual.imagens[indiceImagemAtual].url_img;
                
        const miniaturas = miniaturasContainer.querySelectorAll('img');
        miniaturas.forEach((img, index) => {
            if (index === indiceImagemAtual) {
                img.classList.add('ativo');
            } else {
                img.classList.remove('ativo');
            }
        });
    }

    document.querySelector('.seta-imagem.anterior').addEventListener('click', () => {
        if (produtoAtual.imagens && produtoAtual.imagens.length > 0) {
            indiceImagemAtual = (indiceImagemAtual - 1 + produtoAtual.imagens.length) % produtoAtual.imagens.length;
            atualizarImagemDialog();
        }
    });

    document.querySelector('.seta-imagem.proximo').addEventListener('click', () => {
        if (produtoAtual.imagens && produtoAtual.imagens.length > 0) {
            indiceImagemAtual = (indiceImagemAtual + 1) % produtoAtual.imagens.length;
            atualizarImagemDialog();
        }
    });

    document.querySelector('.fechar-dialog').addEventListener('click', () => {
        document.getElementById('produto-dialog').close();
    });

    function atualizarBotaoLogin() {
        const loginButton = document.getElementById('login-button');
        const token = localStorage.getItem('token');

        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const nomeUsuario = payload.nome.split(' ')[0];

                console.log(payload);

                loginButton.textContent = `Olá, ${nomeUsuario.split('.')[0]}`;
                loginButton.href = '#';
                loginButton.title = 'Sair';

                loginButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('token');
                    window.location.reload();
                });

                loginButton.addEventListener('mouseover', () => {
                    loginButton.textContent = 'Sair';
                });

                loginButton.addEventListener('mouseout', () => {
                    loginButton.textContent = `Olá, ${nomeUsuario.split(' ')[0]}`;
                });
            } catch(error) {
                console.error("Erro ao decodificar token: ", error);

                loginButton.textContent = 'Login';
                loginButton.href = 'html/loginCadastro.html';
                loginButton.title = '';
            }
        } else {
            loginButton.textContent = 'Login';
            loginButton.href = 'html/loginCadastro.html';
            loginButton.title = '';
        }
    }

});