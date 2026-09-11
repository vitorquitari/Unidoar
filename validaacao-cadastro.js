// ============================================
// VALIDAÇÃO E CADASTRO DE DOADOR
// ============================================

const formCadastro = document.getElementById('formCadastro');
const formCadastroONG = document.getElementById('formCadastroONG');

// ============================================
// FUNÇÕES DE VALIDAÇÃO GERAIS
// ============================================

function mostrarErro(id, mensagem) {
  const campo = document.getElementById(id);
  if (campo) {
    campo.textContent = mensagem;
    campo.style.display = 'block';
  }
}

function limparErro(id) {
  const campo = document.getElementById(id);
  if (campo) {
    campo.textContent = '';
    campo.style.display = 'none';
  }
}

function limparTodosErros() {
  document.querySelectorAll('.erro-msg').forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarSenha(senha) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(senha);
}

function validarTelefone(tel) {
  return /^[0-9]{9,15}$/.test(tel.replace(/\s/g, ''));
}

function mostrarAlerta(mensagem, tipo) {
  // Remove alerta anterior se existir
  const anterior = document.getElementById('alerta-global');
  if (anterior) anterior.remove();

  const alerta = document.createElement('div');
  alerta.id = 'alerta-global';
  alerta.textContent = mensagem;
  alerta.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    z-index: 9999;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    animation: slidein 0.3s ease;
    max-width: 350px;
    ${tipo === 'sucesso'
      ? 'background:#d4edda; color:#155724; border:1px solid #c3e6cb;'
      : 'background:#f8d7da; color:#721c24; border:1px solid #f5c6cb;'
    }
  `;

  document.body.appendChild(alerta);

  setTimeout(() => {
    alerta.style.opacity = '0';
    alerta.style.transition = 'opacity 0.5s ease';
    setTimeout(() => alerta.remove(), 500);
  }, 4000);
}

// ============================================
// CADASTRO DE DOADOR
// ============================================

if (formCadastro) {
  formCadastro.addEventListener('submit', async function (e) {
    e.preventDefault();
    limparTodosErros();

    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const senha = document.getElementById('senha').value;
    const confirmar = document.getElementById('confirmar').value;
    const termos = document.getElementById('termos').checked;

    let valido = true;

    // Validar nome
    if (nome.length < 3) {
      mostrarErro('erro-nome', 'O nome deve ter pelo menos 3 caracteres.');
      valido = false;
    }

    // Validar email
    if (!validarEmail(email)) {
      mostrarErro('erro-email', 'Insira um e-mail válido.');
      valido = false;
    }

    // Validar telefone
    if (!validarTelefone(telefone)) {
      mostrarErro('erro-telefone', 'Insira um telefone válido (9 a 15 dígitos).');
      valido = false;
    }

    // Validar senha
    if (!validarSenha(senha)) {
      mostrarErro('erro-senha', 'A senha deve ter 8+ caracteres, 1 maiúscula, 1 minúscula e 1 número.');
      valido = false;
    }

    // Confirmar senha
    if (senha !== confirmar) {
      mostrarErro('erro-confirmar', 'As palavras-passe não coincidem.');
      valido = false;
    }

    // Termos
    if (!termos) {
      mostrarErro('erro-termos', 'Deves aceitar os Termos de Uso.');
      valido = false;
    }

    if (!valido) return;

    // Botão loading
    const btn = formCadastro.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'A criar conta...';

    try {
      const resposta = await fetch('/api/registro/doador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, telefone, senha })
      });

      const resultado = await resposta.json();

      if (resultado.sucesso) {
        // Guardar token e dados
        localStorage.setItem('token', resultado.token);
        localStorage.setItem('usuarioLogado', JSON.stringify(resultado.usuario));

        mostrarAlerta('✅ Conta criada com sucesso! Redirecionando...', 'sucesso');

        setTimeout(() => {
          window.location.href = 'logindoador.html';
        }, 2000);
      } else {
        mostrarAlerta('❌ ' + resultado.mensagem, 'erro');
        btn.disabled = false;
        btn.textContent = 'Criar Conta';
      }
    } catch (error) {
      mostrarAlerta('❌ Erro de conexão. Tente novamente.', 'erro');
      btn.disabled = false;
      btn.textContent = 'Criar Conta';
    }
  });
}

// ============================================
// CADASTRO DE ONG
// ============================================

if (formCadastroONG) {

  // Mostrar nome do ficheiro selecionado
  document.getElementById('logo')?.addEventListener('change', function () {
    const nome = this.files[0]?.name || 'Nenhum ficheiro selecionado';
    document.getElementById('nome-logo').textContent = nome;
  });

  document.getElementById('doc-registo')?.addEventListener('change', function () {
    const nome = this.files[0]?.name || 'Nenhum ficheiro selecionado';
    document.getElementById('nome-doc').textContent = nome;
  });

  formCadastroONG.addEventListener('submit', async function (e) {
    e.preventDefault();
    limparTodosErros();

    const nomeOng = document.getElementById('nome-ong').value.trim();
    const nif = document.getElementById('nif').value.trim();
    const area = document.getElementById('area').value.trim();
    const emailInst = document.getElementById('email-inst').value.trim();
    const telOng = document.getElementById('tel-ong').value.trim();
    const endereco = document.getElementById('endereco').value.trim();
    const provincia = document.getElementById('provincia').value.trim();
    const municipio = document.getElementById('municipio').value.trim();
    const nomeRep = document.getElementById('nome-rep').value.trim();
    const cargo = document.getElementById('cargo').value.trim();
    const senha = document.getElementById('senha').value;
    const confirmar = document.getElementById('confirmar').value;
    const termos = document.getElementById('termos').checked;
    const declaracao = document.getElementById('declaracao').checked;
    const docRegisto = document.getElementById('doc-registo').files[0];

    let valido = true;

    
    if (nomeOng.length < 3) {
      mostrarErro('erro-nome-ong', 'O nome da ONG deve ter pelo menos 3 caracteres.');
      valido = false;
    }

    if (!/^\d{9}$/.test(nif)) {
      mostrarErro('erro-nif', 'O NIF deve ter 9 dígitos.');
      valido = false;
    }

    if (area.length < 3) {
      mostrarErro('erro-area', 'Indique a área de atuação.');
      valido = false;
    }

    if (!validarEmail(emailInst)) {
      mostrarErro('erro-email-inst', 'Insira um e-mail institucional válido.');
      valido = false;
    }

    if (!validarTelefone(telOng)) {
      mostrarErro('erro-tel-ong', 'Insira um telefone válido.');
      valido = false;
    }

    if (endereco.length < 5) {
      mostrarErro('erro-endereco', 'Insira um endereço válido.');
      valido = false;
    }

    if (nomeRep.length < 3) {
      mostrarErro('erro-nome-rep', 'Insira o nome do representante.');
      valido = false;
    }

    if (cargo.length < 2) {
      mostrarErro('erro-cargo', 'Insira o cargo do representante.');
      valido = false;
    }

    if (!docRegisto) {
      mostrarErro('erro-doc-registo', 'O documento de registo é obrigatório.');
      valido = false;
    }

    if (!validarSenha(senha)) {
      mostrarErro('erro-senha', 'A senha deve ter 8+ caracteres, 1 maiúscula, 1 minúscula e 1 número.');
      valido = false;
    }

    if (senha !== confirmar) {
      mostrarErro('erro-confirmar', 'As palavras-passe não coincidem.');
      valido = false;
    }

    if (!termos) {
      mostrarErro('erro-termos', 'Deves aceitar os Termos de Uso.');
      valido = false;
    }

    if (!declaracao) {
      mostrarErro('erro-declaracao', 'Deves confirmar a declaração.');
      valido = false;
    }

    if (!valido) return;

    // Botão loading
    const btn = formCadastroONG.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'A cadastrar ONG...';

    try {
      // Usar FormData para enviar ficheiros
      const formData = new FormData();
      formData.append('nomeOng', nomeOng);
      formData.append('nif', nif);
      formData.append('area', area);
      formData.append('emailInst', emailInst);
      formData.append('telOng', telOng);
      formData.append('endereco', endereco);
      formData.append('provincia', provincia);
      formData.append('municipio', municipio);
      formData.append('nomeRep', nomeRep);
      formData.append('cargo', cargo);
      formData.append('senha', senha);
      formData.append('docRegisto', docRegisto);

      const logo = document.getElementById('logo').files[0];
      if (logo) formData.append('logo', logo);

      const resposta = await fetch('/api/registro/ong', {
        method: 'POST',
        body: formData
      });

      const resultado = await resposta.json();

      if (resultado.sucesso) {
        localStorage.setItem('token', resultado.token);
        localStorage.setItem('usuarioLogado', JSON.stringify(resultado.usuario));

        mostrarAlerta('✅ ONG cadastrada com sucesso! Redirecionando...', 'sucesso');

        setTimeout(() => {
          window.location.href = 'loginONG.html';
        }, 2000);
      } else {
        mostrarAlerta('❌ ' + resultado.mensagem, 'erro');
        btn.disabled = false;
        btn.textContent = 'Cadastrar ONG';
      }
    } catch (error) {
      mostrarAlerta('❌ Erro de conexão. Tente novamente.', 'erro');
      btn.disabled = false;
      btn.textContent = 'Cadastrar ONG';
    }
  });
}