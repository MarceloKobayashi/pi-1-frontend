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
                        <button class="action-btn edit-btn">Editar</button>
                        <button class="action-btn delete-btn">Excluir</button>
                    </div>
                `).join('');

        } catch (error) {
            console.error("Erro: ", error);
            listaEnderecos.innerHTML = `<div class="error">Erro ao carregar endereços: ${error.message}</div>`;
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