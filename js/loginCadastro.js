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
    const tipo = document.getElementById('cadastro-tipo').value;

    console.log("Dados enviados:", { nome, email, senha, telefone, tipo });
    console.log("JSON enviado:", JSON.stringify({ nome, email, senha, telefone, tipo }));

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
                tipo,
                telefone
            })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Cadastro realizado com sucesso!');
            
            document.getElementById('div-cadastro').style.display = 'none';
            document.getElementById('div-login').style.display = 'block';
        } else {
            alert(data.detail || 'Erro ao realizar o cadastro');
        }
    } catch (error) {
        alert('Erro ao se comunicar com o servidor');
        console.error(error);
    }
})

document.getElementById('loginForm').addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("login-email").value;
    const senha = document.getElementById("login-senha").value;
    
    console.log("Dados enviados:", { email, senha});
    console.log("JSON enviado:", JSON.stringify({ email, senha }));

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Login realizado com sucesso.');
            localStorage.setItem('token', data.access_token);

            //window.location.href = 'home.html'
        } else {
            alert(data.detail || 'Erro ao fazer login.');
        }
    } catch (error) {
        alert('Erro ao se comunicar com o servidor.');
        console.error(error);
    }
})
