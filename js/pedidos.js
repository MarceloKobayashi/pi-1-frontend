const pedidosContainer = document.getElementById("pedidos-container");

async function carregarPedidos() {
    const token = localStorage.getItem("token");
    const response = await fetch("http://localhost:8000/carrinho/pedidos", {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        pedidosContainer.innerHTML = `<p>Erro ao caregar os pedidos.</p>`;
        return;
    }

    const pedidos = await response.json();
    if (pedidos.length === 0) {
        pedidosContainer.innerHTML = `<p>Você ainda não finalizou nenhum pedido.</p>`;
        return;
    }

    pedidos.forEach(pedido => {
        const pedidoEl = document.createElement("div");
        pedidoEl.classList.add("pedido");

        pedidoEl.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <h3 style="margin: 0;">Pedido #${pedido.id}</h3>
                <span class="status-pago">Pago</span>
            </div>
            ${pedido.itens.map(item => `
                <div class="produto">
                <img src="${item.imagem_url || 'https://via.placeholder.com/80'}" alt="${item.produto_nome}" />
                <div class="produto-info">
                    <span><strong>${item.produto_nome}</strong></span>
                    <span>Preço: R$ ${item.produto_preco.toFixed(2)}</span>
                    <span>Qtd: ${item.quantidade}</span>
                    <span>Subtotal: R$ ${item.subtotal.toFixed(2)}</span>
                </div>
                </div>
            `).join("")}
            <div class="pedido-total">Total: R$ ${pedido.total.toFixed(2)}</div>
        `;

        pedidosContainer.appendChild(pedidoEl);
    });
}

carregarPedidos();