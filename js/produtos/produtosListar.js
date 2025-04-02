document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if(!token) {
        window.location.href = '../loginCadastro.html';
        return;
    }

    document.getElementById('btn-logout').addEventListener("click", () => {
        localStorage.removeItem('token');
        window.location.href = '../loginCadastro.html';
    });

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.tipo !== 'vendedor') {
            window.location.href = '../loginCadastro.html';
            return;
        }

        const response = await fetch('http://localhost:8000/produtos/listar-meus-produtos', {
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

    function exibirProdutos(produtos) {
        const container = document.getElementById('produtos-container');
        const loading = document.getElementById('loading');

        if (produtos.length === 0) {
            loading.innerHTML = '<p>Nenhum produto cadastrado ainda. <a href="produtosCadastro.html">Cadastre seu primeiro produto.</a></p>';
            return;
        }

        loading.style.display = 'none';

        produtos.forEach(produto => {
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
                </div>
            `;

            container.appendChild(card);
        });
    }
});