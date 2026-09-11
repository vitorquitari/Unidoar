require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'unidoar_chave_secreta_2024';

// ============================================
// MIDDLEWARES
// ============================================
app.use(express.json());
app.use(cors());


// ... outras configurações ...
app.use(express.static(path.join(__dirname, 'Public'), {
  index: 'index.html'
}));

app.use('/uploads', express.static('uploads'));

app.listen(3001, () => {
  // ...
});


// ============================================
// CONFIGURAÇÃO DE UPLOAD DE FICHEIROS
// ============================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const tipos = /jpeg|jpg|png|pdf/;
    const valido = tipos.test(path.extname(file.originalname).toLowerCase());
    valido ? cb(null, true) : cb(new Error('Apenas JPG, PNG ou PDF!'));
  }
});

// ============================================
// ROTA DE REGISTRO — DOADOR
// ============================================
app.post('/api/registro/doador', async (req, res) => {
  const { nome, email, telefone, senha } = req.body;

  if (!nome || !email || !telefone || !senha) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Todos os campos são obrigatórios!'
    });
  }

  db.get('SELECT id FROM doadores WHERE email = ?', [email], async (err, existe) => {
    if (existe) {
      return res.status(409).json({
        sucesso: false,
        mensagem: 'Este e-mail já está cadastrado!'
      });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    db.run(
      'INSERT INTO doadores (nome, email, telefone, senha) VALUES (?, ?, ?, ?)',
      [nome, email, telefone, senhaCriptografada],
      function (err) {
        if (err) {
          return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao criar conta!'
          });
        }

        const token = jwt.sign(
          { id: this.lastID, tipo: 'doador', email },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.status(201).json({
          sucesso: true,
          mensagem: 'Conta criada com sucesso!',
          token,
          usuario: {
            id: this.lastID,
            nome,
            email,
            tipo: 'doador'
          }
        });
      }
    );
  });
});

// ============================================
// ROTA DE LOGIN — DOADOR
// ============================================
app.post('/api/login/doador', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'E-mail e senha são obrigatórios!'
    });
  }

  db.get(
    'SELECT * FROM doadores WHERE email = ? AND ativo = 1',
    [email],
    async (err, usuario) => {
      if (!usuario) {
        return res.status(401).json({
          sucesso: false,
          mensagem: 'E-mail ou senha incorretos!'
        });
      }

      const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

      if (!senhaCorreta) {
        return res.status(401).json({
          sucesso: false,
          mensagem: 'E-mail ou senha incorretos!'
        });
      }

      db.run(
        'UPDATE doadores SET ultimo_login = CURRENT_TIMESTAMP WHERE id = ?',
        [usuario.id]
      );

      const token = jwt.sign(
        { id: usuario.id, tipo: 'doador', email: usuario.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        sucesso: true,
        mensagem: 'Login realizado com sucesso!',
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          tipo: 'doador'
        }
      });
    }
  );
});

// ============================================
// ROTA DE REGISTRO — ONG
// ============================================
app.post('/api/registro/ong',
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'docRegisto', maxCount: 1 }
  ]),
  async (req, res) => {
    const {
      nomeOng, nif, area, emailInst, telOng,
      endereco, provincia, municipio,
      nomeRep, cargo, senha
    } = req.body;

    if (!nomeOng || !nif || !area || !emailInst || !senha) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Campos obrigatórios em falta!'
      });
    }

    if (!req.files?.docRegisto) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Documento de registo é obrigatório!'
      });
    }

    db.get('SELECT id FROM ongs WHERE email = ? OR nif = ?',
      [emailInst, nif],
      async (err, existe) => {
        if (existe) {
          return res.status(409).json({
            sucesso: false,
            mensagem: 'E-mail ou NIF já cadastrado!'
          });
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10);
        const logoPath = req.files?.logo?.[0]?.filename || null;
        const docPath = req.files.docRegisto[0].filename;

        db.run(`
          INSERT INTO ongs 
          (nome_ong, nif, area, email, telefone, endereco, provincia, municipio, nome_rep, cargo, logo, doc_registo, senha)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [nomeOng, nif, area, emailInst, telOng, endereco, provincia, municipio, nomeRep, cargo, logoPath, docPath, senhaCriptografada],
          function (err) {
            if (err) {
              return res.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao cadastrar ONG!'
              });
            }

            const token = jwt.sign(
              { id: this.lastID, tipo: 'ong', email: emailInst },
              JWT_SECRET,
              { expiresIn: '24h' }
            );

            res.status(201).json({
              sucesso: true,
              mensagem: 'ONG cadastrada com sucesso!',
              token,
              usuario: {
                id: this.lastID,
                nome: nomeOng,
                email: emailInst,
                tipo: 'ong'
              }
            });
          }
        );
      }
    );
  }
);

// ============================================
// ROTA DE LOGIN — ONG
// ============================================
app.post('/api/login/ong', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'E-mail e senha são obrigatórios!'
    });
  }

  db.get(
    'SELECT * FROM ongs WHERE email = ? AND ativo = 1',
    [email],
    async (err, ong) => {
      if (!ong) {
        return res.status(401).json({
          sucesso: false,
          mensagem: 'E-mail ou senha incorretos!'
        });
      }

      const senhaCorreta = await bcrypt.compare(senha, ong.senha);

      if (!senhaCorreta) {
        return res.status(401).json({
          sucesso: false,
          mensagem: 'E-mail ou senha incorretos!'
        });
      }

      db.run(
        'UPDATE ongs SET ultimo_login = CURRENT_TIMESTAMP WHERE id = ?',
        [ong.id]
      );

      const token = jwt.sign(
        { id: ong.id, tipo: 'ong', email: ong.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        sucesso: true,
        mensagem: 'Login realizado com sucesso!',
        token,
        usuario: {
          id: ong.id,
          nome: ong.nome_ong,
          email: ong.email,
          tipo: 'ong'
        }
      });
    }
  );
});

// ============================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ============================================
const verificarToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Token não fornecido!'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token inválido!'
      });
    }
    req.usuarioId = decoded.id;
    req.usuarioTipo = decoded.tipo;
    next();
  });
};

// ============================================
// ROTA PROTEGIDA — PERFIL
// ============================================
app.get('/api/perfil', verificarToken, (req, res) => {
  const tabela = req.usuarioTipo === 'ong' ? 'ongs' : 'doadores';
  const campos = req.usuarioTipo === 'ong'
    ? 'id, nome_ong as nome, email, area, telefone, data_criacao, ultimo_login, status'
    : 'id, nome, email, telefone, data_criacao, ultimo_login';

  db.get(
    `SELECT ${campos} FROM ${tabela} WHERE id = ?`,
    [req.usuarioId],
    (err, usuario) => {
      if (!usuario) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Utilizador não encontrado!'
        });
      }

      res.json({ sucesso: true, usuario });
    }
  );
});

// ============================================
// INICIAR SERVIDOR
// ============================================

// Criar pasta uploads se não existir
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor Unidoar rodando em http://localhost:${PORT}`);
  console.log(`📁 Ficheiros estáticos servidos da pasta /Public`);
});