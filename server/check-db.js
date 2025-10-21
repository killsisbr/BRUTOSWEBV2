import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkDatabase() {
  try {
    const db = await open({
      filename: path.join(__dirname, 'db.sqlite'),
      driver: sqlite3.Database
    });

    // Verificar produtos com imagens
    const produtos = await db.all('SELECT id, nome, imagem FROM produtos');
    console.log('Produtos com imagens:');
    produtos.forEach(produto => {
      console.log(`ID: ${produto.id}, Nome: ${produto.nome}, Imagem: ${produto.imagem}`);
    });

    await db.close();
  } catch (error) {
    console.error('Erro ao acessar o banco de dados:', error);
  }
}

checkDatabase();