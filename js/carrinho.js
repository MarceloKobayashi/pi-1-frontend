document.addEventListener("DOMContentLoaded", async () => {
    const carrinhoItens = document.getElementById('carrinho-itens');
    const resumoCarrinho = document.getElementById('resumo-carrinho');
    const totalCarrinho = document.getElementById('total-carrinho');
    const finalizarBtn = document.getElementById('finalizar-compra');
    const carrinhoCount = document.getElementById('carrinho-count');

    await carregarCarrinho();

    window.atualizarQuantidade = atualizarQuantidade;
    window.removerItem = removerItem;

    async function carregarCarrinho() {
        const token = localStorage.getItem('token');
        try {
            if (!token) {
                alert("Faça login para ter/acessar seu carrinho.");
                window.location.href = 'loginCadastro.html';
                return;
            }

            const response = await fetch('http://localhost:8000/carrinho/exibir', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar o carrinho.');
            }

            const carrinho = await response.json();

            if (carrinho.itens && carrinho.itens.length > 0) {
                renderizarItens(carrinho.itens);
                totalCarrinho.textContent = `R$ ${carrinho.total.toFixed(2)}`;
                carrinhoCount.textContent = carrinho.itens.length;
                resumoCarrinho.style.display = 'block';
            } else {
                carrinhoItens.innerHTML = '<div class="carrinho-vazio">Seu carrinho está vazio.</div>';
                resumoCarrinho.style.display = 'none';
                carrinhoCount.textContent = "0";
            }

        } catch (error) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.tipo === "vendedor") {
                alert("Usuários do tipo vendedor não possuem carrinho.");
                throw new Error("Usuários do tipo vendedor não possuem carrinho.");
            } else {
                console.error("Erro: ", error);
                alert("Erro ao carregar carrinho.");
            }
        }
    }

    function renderizarItens(itens) {
        carrinhoItens.innerHTML = '';
        console.log(itens)

        itens.forEach(item => {
            const itemElement = document.createElement('div');

            const imagemUrl = item.imagem_url
                    ? item.imagem_url
                    : 'https://via.placeholder.com/300x200?text=Sem+Imagem';

            itemElement.className = 'item-carrinho';
            itemElement.innerHTML = `
                <div class="item-imagem" style="background-image: url('${imagemUrl}')"></div>
                <div class="item-info">
                    <h3 class="item-nome">${item.produto_nome}</h3>
                    <div class="item-preco">R$ ${item.produto_preco.toFixed(2)}</div>
                    <div class="item-quantidade">
                        <button class="quantidade-btn" onclick="atualizarQuantidade(${item.produto_id}, ${item.quantidade - 1})">-</button>
                        <input type="text" class="quantidade-input" value="${item.quantidade}" data-id="${item.produto_id}" readonly>
                        <button class="quantidade-btn" onclick="atualizarQuantidade(${item.produto_id}, ${item.quantidade + 1})">+</button>
                    </div>
                    <div class="remover-item" onclick="removerItem(${item.produto_id})">Remover</div>
                </div>
            `;

            carrinhoItens.appendChild(itemElement);
        });
    }

    async function atualizarQuantidade(produtoId, novaQuantidade) {
        try {
            if (novaQuantidade < 1) {
                removerItem(produtoId);
                return;
            }

            const token = localStorage.getItem("token");
            if (!token) {
                alert("Faça login para modificar seu carrinho.");
                window.location.href = '/loginCadastro.html';
                return;
            }

            const inputElement = document.querySelector(`.quantidade-input[data-id="${produtoId}"]`);
            const quantidadeAtual = parseInt(inputElement.value);

            if (quantidadeAtual < 1) {
                removerItem(produtoId);
                return;
            }

            const response = await fetch("http://localhost:8000/carrinho/adicionar", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    produto_id: produtoId,
                    quantidade: novaQuantidade
                })
            });

            if (!response.ok) {
                throw new Error("Erro ao atualizar quantidade.");
            }

            await carregarCarrinho();
        } catch (error) {
            console.error("Erro: ", error);
            alert("Erro ao atualizar quantidade.");
        }
    }

    async function removerItem(produtoId) {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Faça login para modificar seu carrinho.");
                window.location.href = '/loginCadastro.html';
                return;
            }

            const response = await fetch('http://localhost:8000/carrinho/remover-desfazer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    produto_id: produtoId
                })
            });

            if (!response.ok) {
                throw new Error("Erro ao remover item.");
            }

            showUndoNotification(produtoId);

            await carregarCarrinho();
        } catch (error) {
            console.error("Erro: ", error);
            alert("Erro ao remover item.");
        }
    }

    function showUndoNotification(produtoId) {
        const existingNotification = document.querySelector('.undo-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'undo-notification';
        notification.innerHTML = `
            <span>Item removido</span>
            <button id="undo-btn">Desfazer</button>
        `;

        document.body.appendChild(notification);

        const timeout = setTimeout(() => {
            notification.remove();
        }, 30000);

        const undoBtn = document.getElementById('undo-btn');
        undoBtn.addEventListener('click', async () => {
            clearTimeout(timeout);
            notification.remove();

            await undoRemove(produtoId);
        });
    }

    async function undoRemove(produtoId) {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Faça login para modificar seu carrinho.");
                window.location.href = '/loginCadastro.html';
                return;
            }

            const response = await fetch('http://localhost:8000/carrinho/desfazer-remocao', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    produto_id: produtoId
                })
            });

            if (!response.ok) {
                throw new Error("Erro ao desfazer remoção.");
            }

            await carregarCarrinho();
        } catch (error) {
            console.error("Erro: ", error);
            if (error.message.includes("Tempo para desfazer expirado")) {
                alert("O tempo para desfazer a remoção expirou.");
            } else {
                alert("Erro ao desfazer remoção.");
            }
        }
    }
});