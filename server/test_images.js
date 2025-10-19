import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testImages() {
  try {
    const db = await open({
      filename: path.join(__dirname, 'db.sqlite'),
      driver: sqlite3.Database
    });

    // Verificar todos os produtos e suas imagens
    const produtos = await db.all('SELECT id, nome, imagem FROM produtos');
    console.log('=== PRODUTOS E SUAS IMAGENS ===');
    
    let produtosSemImagem = 0;
    let produtosComImagem = 0;
    
    for (const produto of produtos) {
      if (produto.imagem) {
        produtosComImagem++;
        console.log(`✓ ID: ${produto.id}, Nome: ${produto.nome}`);
        console.log(`  Imagem: ${produto.imagem}`);
      } else {
        produtosSemImagem++;
        console.log(`✗ ID: ${produto.id}, Nome: ${produto.nome} (SEM IMAGEM)`);
      }
      console.log('---');
    }
    
    console.log(`\nResumo:`);
    console.log(`- Produtos com imagem: ${produtosComImagem}`);
    console.log(`- Produtos sem imagem: ${produtosSemImagem}`);
    console.log(`- Total de produtos: ${produtos.length}`);
    
    await db.close();
  } catch (error) {
    console.error('Erro ao testar imagens:', error);
  }
}

testImages();