const API_URL = 'http://localhost:8000/auth';

document.getElementById("btn-mostrar-login").addEventListener("click", async () => {
    document.getElementById('div-cadastro').style.display = 'none';
    document.getElementById('div-login').style.display = 'block';
})

document.getElementById("btn-mostrar-cadastro").addEventListener("click", async () => {
    document.getElementById('div-login').style.display = 'none';
    document.getElementById('div-cadastro').style.display = 'block';
})

document.getElementById('cadastroForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const nome = document.getElementById('cadastro-nome').value;
    const email = document.getElementById('cadastro-email').value;
    const senha = document.getElementById('cadastro-senha').value;
    const telefone = document.getElementById('cadastro-telefone').value;

    try {
        const response = await fetch(`${API_URL}/cadastrar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nome,
                email,
                senha,
                tipo: "usuario",
                telefone
            })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Cadastro realizado com sucesso!');
        } else {
            alert(data.detail || 'Erro ao realizar o cadastro');
        }
    } catch (error) {
        alert('Erro ao se comunicar com o servidor');
        console.error(error);
    }
})
