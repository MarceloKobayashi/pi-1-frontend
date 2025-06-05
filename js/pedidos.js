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
                <h3 style="margin: 0;">Pedido #${pedido.id} - ${formatarData(pedido.data_adicao)}</h3>
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

function formatarData(dataISO) {
    const data = new Date(dataISO);
    
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    const horas = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');
    const segundos = String(data.getSeconds()).padStart(2, '0');
    
    return `${dia}/${mes}/${ano} - ${horas}:${minutos}:${segundos}`;
}

carregarPedidos();