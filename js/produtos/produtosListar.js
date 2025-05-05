document.addEventListener("DOMContentLoaded", async () => {
    const filtroCategoria = document.querySelector('.filtro-categoria');
    const barraPesquisa = document.querySelector(".barra-pesquisa");

    let categorias = [];

    const token = localStorage.getItem("token");
    if(!token) {
        window.location.href = '../loginCadastro.html';
        return;
    }

    document.getElementById('btn-logout').addEventListener("click", () => {
        localStorage.removeItem('token');
        window.location.href = '../loginCadastro.html';
    });

    await carregarProdutos();

    async function carregarProdutos() {
        try {
            const container = document.getElementById('produtos-container');
            container.innerHTML = '';
            document.getElementById('loading').style.display = 'block';
            document.getElementById('loading').textContent = 'Carregando produtos...';

            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.tipo !== 'vendedor') {
                window.location.href = '../../index.html';
                return;
            }

            await carregarCategorias();
    
            let url = 'http://localhost:8000/produtos/listar-meus-produtos';

            const categoriaId = filtroCategoria.value;
            const termoPesquisa = barraPesquisa.value.trim();

            const params = new URLSearchParams();
            if (categoriaId) params.append('categoria_id', categoriaId);
            if (termoPesquisa) params.append('nome', termoPesquisa);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
    
            if (!response.ok) {
                throw new Error("Erro ao carregar produtos.");
            }
    
            const produtos = await response.json();
            exibirProdutos(produtos);
        } catch (e) {
            console.error("Erro: ", e);
            document.getElementById('loading').textContent = "Erro ao carregar produtos. Tente novamente.";
        }
    }

    function exibirProdutos(produtos) {
        const container = document.getElementById('produtos-container');
        const loading = document.getElementById('loading');

        container.innerHTML = '';
        loading.style.display = 'block';

        if (produtos.length === 0) {
            loading.innerHTML = '<p>Nenhum produto cadastrado ainda. <a href="produtosCadastro.html">Cadastre seu primeiro produto.</a></p>';
            return;
        }

        loading.style.display = 'none';

        const produtosPorCategoria = {};
        produtos.forEach(produto => {
            const categoriaId = produto.fk_produtos_categoria_id || 'outros';
            const categoriaNome = categorias.find(e => e.id === categoriaId)?.nome || "Outros";

            if(!produtosPorCategoria[categoriaId]) {
                produtosPorCategoria[categoriaId] = {
                    nome: categoriaNome,
                    produtos:[]
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
                const card = document.createElement('div');
                card.className = 'produto-card';
                
                const imagemUrl = produto.imagens && produto.imagens.length > 0
                    ?produto.imagens[0].url_img
                    : 'https://via.placeholder.com/300x200?text=Sem+Imagem';
                
                card.innerHTML = `
                    <div class="produto-imagem" style="background-image: url('${imagemUrl}')"></div>
                    <div class="produto-info">
                        <h3>${produto.nome}</h3>
                        <p>${produto.descricao || "Sem descrição"}</p>
                        <div class="produto-preco">R$ ${produto.preco.toFixed(2)}</div>
                        <span class="produto-estoque">Estoque: ${produto.qntd_estoque}</span>
                        <div class="produto-actions">
                            <button class="btn-editar" data-id="${produto.id}">Editar</button>
                            <button class="btn-deletar" data-id="${produto.id}">Deletar</button>
                        </div>
                    </div>
                `;
            
                grid.appendChild(card);
            });
            container.appendChild(section);
        }

        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const produtoId = e.target.getAttribute('data-id');
                const produtos = JSON.parse(localStorage.getItem('produtosCache') || '[]');

                abrirDialog(produtoId, produtos);
            });
        });

        document.querySelectorAll('.btn-deletar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const produtoId = e.target.getAttribute('data-id');

                deletarProduto(produtoId);
            });
        });

        localStorage.setItem('produtosCache', JSON.stringify(produtos));
    }

    async function abrirDialog(produtoId, produtos) {
        const produto = produtos.find(p => p.id == produtoId);
        console.log(produto);

        if (!produto) return;

        await carregarCategorias();

        document.getElementById('editar-id').value = produto.id;
        document.getElementById('editar-nome').value = produto.nome;
        document.getElementById('editar-descricao').value = produto.descricao || '';
        document.getElementById('editar-preco').value = produto.preco;
        document.getElementById('editar-quantidade').value = produto.qntd_estoque;

        if (produto.fk_produtos_categoria_id) {
            document.getElementById('editar-categoria').value = produto.fk_produtos_categoria_id;
        }

        document.getElementById('editar-imagens-container').innerHTML = '';
        if (produto.imagens && produto.imagens.length > 0) {
            produto.imagens.forEach((imagem, index) => {
                adicionarCampoImagemEditar(imagem.url_img, index);
            });
        }

        editarDialog.showModal();
    }

    const editarDialog = document.getElementById('editar-produto-modal');
    const editarImagensContainer = document.getElementById('editar-imagens-container');

    document.getElementById('cancelar-edicao').addEventListener('click', () => {
        editarDialog.close();
    });

    document.getElementById('btn-adicionar-imagem-editar').addEventListener('click', () => {
        adicionarCampoImagemEditar('', document.getElementById('editar-imagens-container').children.length);
    });

    document.getElementById('editar-produto-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await salvarEdicao();
    });

    function adicionarCampoImagemEditar(url = '', index) {
        const div = document.createElement('div');
        div.className = 'imagem-input-group';
        div.innerHTML = `
            <input type="text" class="imagem-url" placeholder="URL da imagem" value="${url}" required>
            <button type="button" class="remover-imagem">&times;</button>
        `;
        editarImagensContainer.appendChild(div);
        
        div.querySelector('.remover-imagem').addEventListener('click', () => {
            div.remove();
        });
    }

    async function salvarEdicao() {
        const produtoId = document.getElementById('editar-id').value;

        const imagensUrl = [];
        document.querySelectorAll('#editar-imagens-container .imagem-url').forEach(input => {
            if (input.value.trim() !== '') {
                imagensUrl.push(input.value.trim());
            }
        });

        const produtoData = {
            nome: document.getElementById('editar-nome').value,
            descricao: document.getElementById('editar-descricao').value,
            preco: parseFloat(document.getElementById('editar-preco').value),
            qntd_estoque: parseInt(document.getElementById('editar-quantidade').value),
            fk_produtos_categoria_id: parseInt(document.getElementById('editar-categoria').value),
            imagens: imagensUrl.map((url, index) => ({
                url_img: url,
                ordem: index + 1
            }))
        };

        try {
            const response = await fetch(`http://localhost:8000/produtos/editar/${produtoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(produtoData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Erro ao editar produto.");
            }

            const produtoEditado = await response.json();
            const produtosCache = JSON.parse(localStorage.getItem('produtosCache') || []);
            const index = produtosCache.findIndex(p => p.id == produtoId);

            if (index !== -1) {
                produtosCache[index] = produtoEditado;
                localStorage.setItem('produtosCache', JSON.stringify(produtosCache));
            }

            await carregarProdutos();
            editarDialog.close();
            alert('Produto atualizado com sucesso.');
        } catch (error) {
            console.error("erro ao editar produto: ", error);
            alert(`Erro ao editar produto: ${error.message}`);
        }
    }

    async function deletarProduto(produtoId) {
        if (!confirm('Tem certeza que deseja deletar esse produto?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/produtos/deletar/${produtoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Erro ao deletar produto.");
            }

            const container = document.getElementById('produtos-container');
            const card = document.querySelector(`.produto-card [data-id="${produtoId}"]`)?.closest('.produto-card');
            if (card) {
                card.remove();
            }

            const produtosAtualizados = JSON.parse(localStorage.getItem('produtosCache') || '[]').filter(p => p.id != produtoId);
            localStorage.setItem('produtosCache', JSON.stringify(produtosAtualizados));

            if (container.children.length === 0) {
                document.getElementById('loading').style.display = 'block';
                document.getElementById('loading').innerHTML = '<p>Nenhum produto cadastrado ainda. <a href="produtosCadastro.html">Cadastre seu primeiro produto.</a></p>';
            }

            alert("Produto deletado com sucesso!");
        } catch (error) {
            console.error("Erro ao deletar produto: ", error);
            alert(`Erro ao deletar produto: ${error}`);
        } 
    }

    async function carregarCategorias() {
        try {
            if (categorias.length > 0) return categorias;

            const response = await fetch('http://localhost:8000/produtos/categorias');
            if (!response.ok) {
                throw new Error("Falha ao carregar categorias.");
            }
    
            categorias = await response.json();

            const selectEditar = document.getElementById('editar-categoria');
            const selectFiltro = document.querySelector('.filtro-categoria');
            
            if (selectEditar.options.length <= 1) {
                categorias.forEach(cate => {
                    const optionEditar = document.createElement('option');
                    optionEditar.value = cate.id;
                    optionEditar.textContent = cate.nome.charAt(0).toUpperCase() + cate.nome.slice(1).toLowerCase();
                    selectEditar.appendChild(optionEditar);
                });
            }

            if (selectFiltro.options.length <= 1) {
                categorias.forEach(cate => {
                    const optionFiltro = document.createElement('option');
                    optionFiltro.value = cate.id;
                    optionFiltro.textContent = cate.nome.charAt(0).toUpperCase() + cate.nome.slice(1).toLowerCase();
                    selectFiltro.appendChild(optionFiltro);
                });
            }

            return categorias;
        } catch(error) {
            console.error("Erro ao carregar categorias: ", error);
            alert("Erro ao carregar categorias. Tente recarregar a página.");
        }
    }

    document.querySelector('.btn-filtro').addEventListener('click', async() => {
        const categoriaEscolhida = filtroCategoria.value;
        await carregarProdutos();

        if (categoriaEscolhida) {
            filtroCategoria.value = categoriaEscolhida;
        }
    });

    document.querySelector('.barra-pesquisa').addEventListener('keypress', async(e) => {
        if (e.key == 'Enter') {
            await carregarProdutos();
        }
    });

    document.getElementById('btn-ajuda').addEventListener('click', () => {
        document.getElementById('help-dialog').showModal();
    });

    document.getElementById('btn-fechar-dialog').addEventListener('click', () => {
        document.getElementById('help-dialog').close();
    });

    document.getElementById('help-dialog').addEventListener('click', (e) => {
        const dialogDimensions = document.getElementById('help-dialog').getBoundingClientRect();
        if (
            e.clientX < dialogDimensions.left ||
            e.clientX > dialogDimensions.right ||
            e.clientY < dialogDimensions.top ||
            e.clientY > dialogDimensions.bottom
        ) {
            document.getElementById('help-dialog').close()
        }
    });
});
