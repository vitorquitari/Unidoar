const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(
  path.join(__dirname, 'unidoar.db'),
  (err) => {
    if (err) {
      console.error('❌ Erro ao conectar:', err.message);
    } else {
      console.log('✅ Banco de dados Unidoar conectado!');
    }
  }
);

db.serialize(() => {

  // Tabela de Doadores
  db.run(`
    CREATE TABLE IF NOT EXISTS doadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      telefone TEXT NOT NULL,
      senha TEXT NOT NULL,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      ultimo_login DATETIME,
      ativo INTEGER DEFAULT 1
    )
  `, (err) => {
    if (!err) console.log('✅ Tabela doadores pronta!');
  });

  // Tabela de ONGs
  db.run(`
    CREATE TABLE IF NOT EXISTS ongs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_ong TEXT NOT NULL,
      nif TEXT UNIQUE NOT NULL,
      area TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      telefone TEXT NOT NULL,
      endereco TEXT NOT NULL,
      provincia TEXT NOT NULL,
      municipio TEXT NOT NULL,
      nome_rep TEXT NOT NULL,
      cargo TEXT NOT NULL,
      logo TEXT,
      doc_registo TEXT NOT NULL,
      senha TEXT NOT NULL,
      status TEXT DEFAULT 'pendente',
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      ultimo_login DATETIME,
      ativo INTEGER DEFAULT 1
    )
  `, (err) => {
    if (!err) console.log('✅ Tabela ONGs pronta!');
  });

});

module.exports = db;