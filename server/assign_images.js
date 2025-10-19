import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function assignImages() {
  try {
    const db = await open({
      filename: path.join(__dirname, 'db.sqlite'),
      driver: sqlite3.Database
    });

    // Obter lista de arquivos de imagem na pasta uploads
    const uploadsDir = path.join(__dirname, 'uploads');
    const imageFiles = fs.readdirSync(uploadsDir).filter(file => 
      file.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    );
    
    console.log(`Encontradas ${imageFiles.length} imagens na pasta uploads`);
    
    if (imageFiles.length === 0) {
      console.log('Nenhuma imagem encontrada para associar');
      await db.close();
      return;
    }
    
    // Obter todos os produtos
    const produtos = await db.all('SELECT id, nome FROM produtos');
    console.log(`Encontrados ${produtos.length} produtos`);
    
    // Associar imagens aos produtos (uma imagem por produto)
    let imageIndex = 0;
    for (const produto of produtos) {
      if (imageIndex >= imageFiles.length) {
        imageIndex = 0; // Reiniciar do início se necessário
      }
      
      const imagePath = `/uploads/${imageFiles[imageIndex]}`;
      
      // Atualizar produto com a imagem
      await db.run(
        'UPDATE produtos SET imagem = ? WHERE id = ?',
        [imagePath, produto.id]
      );
      
      console.log(`✓ Produto ${produto.nome} associado à imagem ${imageFiles[imageIndex]}`);
      imageIndex++;
    }
    
    console.log(`\nTodas as ${produtos.length} imagens foram associadas aos produtos!`);
    
    await db.close();
  } catch (error) {
    console.error('Erro ao associar imagens:', error);
  }
}

assignImages();