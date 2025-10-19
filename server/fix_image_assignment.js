import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapeamento de categorias para tipos de produtos
const categoriaImagens = {
  'Lanches Especiais': ['burguer', 'hamburguer', 'brutus', 'x-', 'big', 'dallas', 'explosao', 'mexico', 'brutal', 'catupiry'],
  'Lanches Tradicionais': ['x-', 'burguer', 'frango', 'salada', 'egg', 'bacon', 'tudo', 'calabresa'],
  'Porções': ['batata', 'onion', 'crinkle', 'palito', 'rustica', 'calabresa'],
  'Adicionais': ['queijo', 'bacon', 'catupiry', 'cheddar', 'hamburguer', 'salada', 'doritos'],
  'Bebidas': ['coca', 'guarana', 'lata', '2l']
};

// Função para determinar a categoria de uma imagem com base no nome do arquivo
function getCategoriaFromImageName(imageName, produtoNome) {
  const lowerImageName = imageName.toLowerCase();
  const lowerProdutoNome = produtoNome.toLowerCase();
  
  // Primeiro, tentar casar com o nome do produto
  for (const [categoria, keywords] of Object.entries(categoriaImagens)) {
    for (const keyword of keywords) {
      if (lowerProdutoNome.includes(keyword) || lowerImageName.includes(keyword)) {
        return categoria;
      }
    }
  }
  
  // Se não encontrar, retornar a primeira categoria que combinar parcialmente
  for (const [categoria, keywords] of Object.entries(categoriaImagens)) {
    if (lowerProdutoNome.includes(categoria.toLowerCase().replace(' ', '')) || 
        lowerImageName.includes(categoria.toLowerCase().replace(' ', ''))) {
      return categoria;
    }
  }
  
  // Se ainda não encontrar, retornar categoria com base na primeira palavra do produto
  const firstWord = lowerProdutoNome.split(' ')[0];
  for (const [categoria, keywords] of Object.entries(categoriaImagens)) {
    if (keywords.some(keyword => firstWord.includes(keyword))) {
      return categoria;
    }
  }
  
  // Categoria padrão
  return 'Lanches Especiais';
}

// Função para obter produtos agrupados por categoria
async function getProdutosPorCategoria(db) {
  const produtos = await db.all('SELECT id, nome, categoria FROM produtos ORDER BY categoria, nome');
  
  const produtosPorCategoria = {};
  for (const produto of produtos) {
    if (!produtosPorCategoria[produto.categoria]) {
      produtosPorCategoria[produto.categoria] = [];
    }
    produtosPorCategoria[produto.categoria].push(produto);
  }
  
  return produtosPorCategoria;
}

async function fixImageAssignment() {
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
    
    // Obter produtos agrupados por categoria
    const produtosPorCategoria = await getProdutosPorCategoria(db);
    
    // Criar um pool de imagens por categoria
    const imagePoolPorCategoria = {};
    
    // Inicializar pools vazios
    for (const categoria in produtosPorCategoria) {
      imagePoolPorCategoria[categoria] = [];
    }
    
    // Classificar imagens nas categorias apropriadas
    for (const imageFile of imageFiles) {
      // Tentar determinar a categoria mais apropriada para esta imagem
      let categoriaApropriada = 'Lanches Especiais'; // Categoria padrão
      
      // Verificar se a imagem tem indicações de categoria no nome
      for (const [categoria, keywords] of Object.entries(categoriaImagens)) {
        const lowerImageName = imageFile.toLowerCase();
        if (keywords.some(keyword => lowerImageName.includes(keyword))) {
          categoriaApropriada = categoria;
          break;
        }
      }
      
      imagePoolPorCategoria[categoriaApropriada].push(imageFile);
    }
    
    // Associar imagens aos produtos por categoria
    let totalAssociados = 0;
    
    for (const [categoria, produtos] of Object.entries(produtosPorCategoria)) {
      // Usar o pool específico da categoria ou todas as imagens como fallback
      let imagePool = imagePoolPorCategoria[categoria];
      if (!imagePool || imagePool.length === 0) {
        imagePool = imageFiles; // Fallback para todas as imagens
      }
      
      let imageIndex = 0;
      
      for (const produto of produtos) {
        if (imageIndex >= imagePool.length) {
          imageIndex = 0; // Reiniciar do início se necessário
        }
        
        const imagePath = `/uploads/${imagePool[imageIndex]}`;
        
        // Atualizar produto com a imagem
        await db.run(
          'UPDATE produtos SET imagem = ? WHERE id = ?',
          [imagePath, produto.id]
        );
        
        console.log(`✓ Produto ${produto.nome} (${categoria}) associado à imagem ${imagePool[imageIndex]}`);
        imageIndex++;
        totalAssociados++;
      }
    }
    
    console.log(`\nTotal de ${totalAssociados} produtos tiveram suas imagens corrigidas!`);
    
    await db.close();
  } catch (error) {
    console.error('Erro ao corrigir associação de imagens:', error);
  }
}

fixImageAssignment();