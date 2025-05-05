document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Faça login para cadastrar seu endereço.');
        window.location.href = 'loginCadastro.html';
        return;
    }

    const listaEnderecos = document.getElementById('lista-enderecos');
    const modal = document.getElementById('endereco-modal');
    const form = document.getElementById('form-endereco');
    const btnNovoEndereco = document.getElementById('btn-novo-endereco');
    const btnCancelar = document.getElementById('btn-cancelar');
    const editarDialog = document.getElementById('editar-endereco-modal');

    await carregarEnderecos();

    btnNovoEndereco.addEventListener('click', () => modal.showModal());
    btnCancelar.addEventListener('click', () => modal.close());

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const endereco = {
            cep: document.getElementById('cep').value,
            logradouro: document.getElementById('logradouro').value,
            numero: document.getElementById('numero').value,
            complemento: document.getElementById('complemento').value,
            cidade: document.getElementById('cidade').value,
            estado: document.getElementById('estado').value
        };

        try {
            const response = await fetch('http://localhost:8000/enderecos/cadastrar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(endereco)
            });

            if (!response.ok) {
                throw new Error("Erro ao cadastrar endereço.");
            }

            modal.close();
            form.reset();

            await carregarEnderecos();
            alert("Endereço cadastrado com sucesso.");
        } catch (error) {
            console.error("Erro: ", error);
            alert(`Erro ao cadastrar endereço: ${error.message}`);
        }
    });

    document.getElementById('cep').addEventListener('blue', buscarCEP);

    async function carregarEnderecos() {
        try {
            const response = await fetch("http://localhost:8000/enderecos/listar", {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Erro ao carregar produtos.");
            }

            const enderecos = await response.json();
            if (enderecos.length === 0) {
                listaEnderecos.innerHTML = '<div class="empty">Nenhum endereço cadastrado.</div>';
                return
            }

            listaEnderecos.innerHTML = enderecos.map(endereco => `
                <div class="endereco-card">
                    <h3>${endereco.logradouro}, ${endereco.numero}</h3>
                    <p>${endereco.complemento || ''}</p>
                    <p>${endereco.cidade} - ${endereco.estado}</p>
                    <p>CEP: ${endereco.cep}</p>
                    <div class="endereco-actions">
                        <button class="action-btn edit-btn" data-id="${endereco.id}">Editar</button>
                        <button class="action-btn delete-btn" data-id="${endereco.id}">Excluir</button>
                    </div>
                `).join('');

            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const enderecoId = e.target.getAttribute('data-id');
                    const enderecos = JSON.parse(localStorage.getItem('enderecosCache') || '[]');
    
                    abrirDialog(enderecoId, enderecos);
                });
            });
        

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const enderecoId = e.target.getAttribute('data-id');
    
                    deletarEndereco(enderecoId);
                });
            });

            localStorage.setItem('enderecosCache', JSON.stringify(enderecos));

        } catch (error) {
            console.error("Erro: ", error);
            listaEnderecos.innerHTML = `<div class="error">Erro ao carregar endereços: ${error.message}</div>`;
        }
    }

    async function abrirDialog(enderecoId, enderecos) {
        const endereco = enderecos.find(e => e.id == enderecoId);
        console.log(endereco);

        if (!endereco) return;

        document.getElementById('editar-id').value = endereco.id;
        document.getElementById('editar-cep').value = endereco.cep;
        document.getElementById('editar-numero').value = endereco.numero;
        document.getElementById('editar-logradouro').value = endereco.logradouro;
        document.getElementById('editar-complemento').value = endereco.complemento;
        document.getElementById('editar-cidade').value = endereco.cidade;
        document.getElementById('editar-estado').value = endereco.estado;

        editarDialog.showModal();
    }

    document.getElementById('btn-cancelar-edicao').addEventListener('click', () => {
        editarDialog.close();
    });

    document.getElementById('form-editar-endereco').addEventListener('submit', async (e) => {
        e.preventDefault();

        const enderecoId = document.getElementById('editar-id').value;

        const enderecoData = {
            cep: document.getElementById('editar-cep').value,
            numero: document.getElementById('editar-numero').value,
            logradouro: document.getElementById('editar-logradouro').value,
            complemento: document.getElementById('editar-complemento').value,
            cidade: document.getElementById('editar-cidade').value,
            estado: document.getElementById('editar-estado').value,
        };

        try {
            const response = await fetch(`http://localhost:8000/enderecos/editar/${enderecoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(enderecoData)
            });

            console.log(enderecoData);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Erro ao editar endereço.");
            }

            const enderecoEditado = await response.json();
            const enderecosCache = JSON.parse(localStorage.getItem('enderecosCache') || []);
            const index = enderecosCache.findIndex(e => e.id == enderecoId);

            if (index !== -1) {
                enderecosCache[index] = enderecoEditado;
                localStorage.setItem('enderecosCache', JSON.stringify(enderecosCache));
            }

            await carregarEnderecos();
            editarDialog.close();
            alert('Endereço atualizado com sucesso.');
        } catch (error) {
            console.error("erro ao editar endereco: ", error);
            alert(`Erro ao editar endereço: ${error.message}`);
        }
    });

    async function deletarEndereco(enderecoId) {
        if (!confirm("Tem certeza que deseja excluir este endereço?")) {
            return;
        }

        console.log(enderecoId);

        try {
            const response = await fetch(`http://localhost:8000/enderecos/deletar/${enderecoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error("Erro ao excluir endereço.");
            }

            const card = document.querySelector(`.endereco-card[data-id="${enderecoId}"]`);
            if (card) {
                card.remove();
            }

            const enderecosAtualizados = JSON.parse(localStorage.getItem('enderecosCache') || '[]').filter(e => e.id != enderecoId);
            localStorage.setItem('enderecosCache', JSON.stringify(enderecosAtualizados));

            const container = document.getElementById('lista-enderecos');
            if (container.children.length === 0) {
                container.innerHTML = '<div class="empty">Nenhum endereço cadastrado. <button id="btn-novo-endereco" class="primary">Cadastre seu primeiro endereço</button></div>';
            }

            alert("Endereço deletado com sucesso");
            carregarEnderecos();

        } catch (error) {
            console.error("Erro: ". error);
            alert(`Erro ao excluir endereço: ${error.message}`);
        }
    }

    async function buscarCEP() {
        const cep = document.getElementById('cep').value.replace(/\D/g, '');
        if (cep.length !== 8) return;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (data.erro) {
                throw new Error("CEP não encontrado.");
            }

            document.getElementById('logradouro').value = data.logradouro;
            document.getElementById('cidade').value = data.localidade;
            document.getElementById('estado').value = data.uf;
            document.getElementById('numero').focus();

        } catch (error) {
            console.error("Erro ao buscar CEP: ", error);
        }
    }

});