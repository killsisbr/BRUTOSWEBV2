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
    
    const produtos = await db.all('SELECT id, nome, imagem FROM produtos LIMIT 10');
    console.log('Produtos no banco de dados:');
    console.log('ID\tNome\t\t\tImagem');
    console.log('------------------------------------------------');
    produtos.forEach(produto => {
      console.log(`${produto.id}\t${produto.nome}\t\t${produto.imagem || 'NULL'}`);
    });
    
    await db.close();
  } catch (error) {
    console.error('Erro ao acessar o banco de dados:', error);
  }
}

checkDatabase();