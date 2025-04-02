document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../html/loginCadastro.html';
        alert("Token não encontrado.");
        return;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.tipo !== 'vendedor') {
        window.location.href = '../html/loginCadastro.html';
        alert("Não é vendedor.");
        return;
    }

    await carregarCategorias();

    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '../html/loginCadastro.html';
    });

    document.getElementById('cadastroForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const produto = {
            nome: document.getElementById('cadastro-nome').value,
            descricao: document.getElementById('cadastro-descricao').value,
            preco: document.getElementById('cadastro-preco').value,
            qntd_estoque: document.getElementById('cadastro-quantidade').value,
            fk_produtos_categoria_id: document.getElementById('cadastro-categoria').value
        };
    
        try {
            const response = await fetch('http://localhost:8000/produtos/criar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(produto)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail | 'Erro ao cadastrar produto.');
            }

            const data = await response.json();
            alert("Produto cadastrado com sucesso.");
            document.getElementById('cadastroForm').reset();
        } catch (error) {
            console.error("Erro: ", error);
            alert(`Erro: ${error.message}`);
        }
    });

    async function carregarCategorias() {
        try {
            const response = await fetch('http://localhost:8000/produtos/categorias');
            if (!response.ok) {
                throw new Error("Falha ao carregar categorias.");
            }

            const categorias = await response.json();
            const select = document.getElementById('cadastro-categoria');

            categorias.forEach(cate => {
                const option = document.createElement('option');
                option.value = cate.id;
                option.textContent = cate.nome;

                select.appendChild(option);
            });
        } catch(error) {
            console.error("Erro ao carregar categorias: ", error);
            alert("Erro ao carregar categorias. Tente recarregar a página.");
        }
    }
});
