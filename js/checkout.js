document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'loginCadastro.html';
        return;
    }

    const listaEnderecos = document.getElementById('address-list');
    const listaItensCarrinho = document.getElementById('cart-items-list');
    const resumoPedido = document.getElementById('order-summary');
    const btnCompletarPedido = document.getElementById('btn-complete-order');
    const btnAdicionarEndereco = document.getElementById('btn-add-address');

    await Promise.all([
        carregarEnderecos(),
        carregarCarrinho()
    ]);

    btnCompletarPedido.addEventListener("click", finalizarCompra);
    btnAdicionarEndereco.addEventListener('click', () => {
        window.location.href = 'endereco.html';
    });

    async function carregarEnderecos() {
        try {
            const response = await fetch('http://localhost:8000/enderecos/listar', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Erro ao carregar endereços.");
            }

            const enderecos = await response.json();
            if (enderecos.length === 0) {
                listaEnderecos.innerHTML = '<div class="empty-message">Nenhum endereço cadastrado.</div>';
                return;
            }

            listaEnderecos.innerHTML = enderecos.map((endereco, index) => `
                <div class="address-card ${index === 0 ? 'selected' : ''}" data-id="${endereco.id}">
                    <h3>Endereço</h3>
                    <p>${endereco.logradouro}, ${endereco.numero}</p>
                    ${endereco.complemento ? `<p>${endereco.complemento}</p>` : ''}
                    <p>${endereco.cidade} - ${endereco.estado}</p>
                    <p>CEP: ${endereco.cep}</p>
                </div>
            `).join('');

            document.querySelectorAll('.address-card').forEach(card => {
                card.addEventListener('click', () => {
                    document.querySelectorAll('.address-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                });
            });
        } catch (error) {
            console.error("Erro: ", error);
            listaEnderecos.innerHTML = `<div class="error">Erro ao carregar endereços: ${error.message}</div>`;
        }
    }

    async function carregarCarrinho() {
        try {
            const response = await fetch('http://localhost:8000/carrinho/exibir', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Erro ao carregar carrinho.");
            }

            const carrinho = await response.json()
            if (carrinho.itens.length === 0) {
                listaItensCarrinho.innerHTML = '<div class="empty-message">Nenhum item no carrinho</div>';
                atualizarOrdem([], 0);
                return;
            }

            listaItensCarrinho.innerHTML = carrinho.itens.map(item => `
                <div class="cart-item">
                    <img src="${item.imagem_url || 'https://via.placeholder.com/80'}" alt="${item.produto_nome}" class="item-image">
                    <div class="item-details">
                        <h3>${item.produto_nome}</h3>
                        <p>Quantidade: ${item.quantidade}</p>
                        <p class="item-price">R$ ${item.produto_preco.toFixed(2).replace('.', ',')}</p>
                        <p>Subtotal: R$ ${item.subtotal.toFixed(2).replace('.', ',')}</p>
                    </div>
                </div>
            `).join('');

            atualizarOrdem(carrinho.itens, carrinho.total);

        } catch (error) {
            console.error("Erro: ", error);
            listaItensCarrinho.innerHTML = `<div class="error">Erro ao carregar carrinho: ${error.message}</div>`;
        }
    }

    function atualizarOrdem(itens, total) {
        const subTotal = itens.reduce((sum, item) => sum + item.subtotal, 0);
        const frete = 5.90;
        const desconto = 0;

        resumoPedido.innerHTML = `
            <div class="summary-row">
                <span>Subtotal (${itens.length} itens)</span>
                <span>R$ ${subTotal.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="summary-row">
                <span>Frete</span>
                <span>R$ ${frete.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="summary-row">
                <span>Desconto</span>
                <span>- R$ ${desconto.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="summary-row total">
                <span>Total</span>
                <span>R$ ${(subTotal + frete - desconto).toFixed(2).replace('.', ',')}</span>
            </div>
        `;
    }

    async function finalizarCompra() {
        try {
            const enderecoSelecionado = document.querySelector('.address-card.selected');
            const metodoPagamento = document.querySelector('input[name="payment"]:checked').id;

            if (!enderecoSelecionado) {
                alert("Selecione um endereço de entrega.");
                return;
            }

            alert("Pedido enviado.");
        } catch (error) {
            console.error("Erro: ", error);
            alert(`Erro ao finalizar a compra: ${error.message}`);
        }
    }

});