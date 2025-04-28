document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../loginCadastro.html';
        alert("Token não encontrado.");
        return;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.tipo !== 'vendedor') {
        window.location.href = '../loginCadastro.html';
        alert("Não é vendedor.");
        return;
    }

    await carregarCategorias();

    adicionarCampoImagem();

    document.getElementById('btn-adicionar-imagem').addEventListener("click", adicionarCampoImagem);


    document.getElementById('cadastroForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const imagens = [];
        document.querySelectorAll('.campo-imagem').forEach((campo, index) => {
            const url = campo.querySelector('input[type="url"]').value;
            if (url) {
                imagens.push({
                    url_img: url,
                    ordem: index + 1
                });
            }
        });

        const produto = {
            nome: document.getElementById('cadastro-nome').value,
            descricao: document.getElementById('cadastro-descricao').value,
            preco: document.getElementById('cadastro-preco').value,
            qntd_estoque: document.getElementById('cadastro-quantidade').value,
            fk_produtos_categoria_id: document.getElementById('cadastro-categoria').value,
            imagens: imagens
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

            window.location.href = 'produtosListar.html';
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
                option.textContent = cate.nome.charAt(0).toUpperCase() + cate.nome.slice(1).toLowerCase();

                select.appendChild(option);
            });
        } catch(error) {
            console.error("Erro ao carregar categorias: ", error);
            alert("Erro ao carregar categorias. Tente recarregar a página.");
        }
    }

    function adicionarCampoImagem() {
        const container = document.getElementById('cadastro-imagens');

        const div = document.createElement('div');
        div.className = 'campo-imagem';
        div.innerHTML = `
            <input type="url" placeholder="URL da Imagem" class="url-imagem">
            <button type="button" class="btn-remover-imagem">Remover</button>
            <img src="" class="preview-imagem" alt="Preview">
        `;
        container.appendChild(div);

        const inputUrl = div.querySelector('.url-imagem');
        const previewImg = div.querySelector('.preview-imagem');

        inputUrl.addEventListener('input', (e) => {
            if (e.target.value) {
                previewImg.src = e.target.value;
                previewImg.style.display = 'block';
            } else {
                previewImg.style.display = 'none';
            }
        });

        div.querySelector('.btn-remover-imagem').addEventListener('click', () => {
            const todosCampos = document.querySelectorAll('.campo-imagem');
            if (todosCampos.length > 1) {
                div.remove();
                
                // Reorganiza as ordens das imagens restantes
                document.querySelectorAll('.campo-imagem').forEach((campo, index) => {
                    // Atualiza a ordem se necessário (para o backend)
                    campo.dataset.ordem = index + 1;
                });
            }
        });
    }
});
