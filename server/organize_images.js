import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para sanitizar nomes de arquivos
function sanitizeFileName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiais
    .replace(/\s+/g, '-') // Substituir espaços por hífens
    .replace(/-+/g, '-') // Remover hífens duplicados
    .trim('-'); // Remover hífens do início e fim
}

// Função para criar diretórios por categoria
function createCategoryDirectories() {
  const categories = ['Lanches Especiais', 'Lanches Tradicionais', 'Porções', 'Adicionais', 'Bebidas'];
  const uploadsDir = path.join(__dirname, 'uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  for (const category of categories) {
    const categoryDir = path.join(uploadsDir, sanitizeFileName(category));
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
  }
}

// Função para mover e renomear imagens
async function moveAndRenameImages(db) {
  const uploadsDir = path.join(__dirname, 'uploads');
  
  // Obter todos os produtos com suas imagens atuais
  const produtos = await db.all('SELECT id, nome, categoria, imagem FROM produtos WHERE imagem IS NOT NULL');
  
  console.log(`Processando ${produtos.length} produtos...`);
  
  let processedCount = 0;
  
  for (const produto of produtos) {
    try {
      // Verificar se a imagem existe
      if (!produto.imagem) continue;
      
      // O caminho da imagem no banco é relativo, vamos converter para caminho absoluto
      const currentImagePath = path.join(__dirname, produto.imagem);
      if (!fs.existsSync(currentImagePath)) {
        console.log(`⚠ Imagem não encontrada para ${produto.nome}: ${produto.imagem}`);
        continue;
      }
      
      // Criar novo nome de arquivo
      const fileExtension = path.extname(currentImagePath);
      const sanitizedProductName = sanitizeFileName(produto.nome);
      const newFileName = `${sanitizedProductName}${fileExtension}`;
      
      // Determinar diretório de destino pela categoria
      const categoryDir = path.join(uploadsDir, sanitizeFileName(produto.categoria));
      const newImagePath = path.join(categoryDir, newFileName);
      
      // Copiar imagem para o novo local (mantendo a original por segurança)
      fs.copyFileSync(currentImagePath, newImagePath);
      
      // Atualizar caminho no banco de dados
      const relativeImagePath = `/uploads/${sanitizeFileName(produto.categoria)}/${newFileName}`;
      await db.run('UPDATE produtos SET imagem = ? WHERE id = ?', [relativeImagePath, produto.id]);
      
      console.log(`✓ ${produto.nome} -> ${relativeImagePath}`);
      processedCount++;
    } catch (error) {
      console.error(`✗ Erro ao processar ${produto.nome}:`, error.message);
    }
  }
  
  console.log(`\nProcessados ${processedCount} produtos com sucesso!`);
}

// Função para limpar imagens antigas não utilizadas
function cleanupOldImages() {
  const uploadsDir = path.join(__dirname, 'uploads');
  
  // Obter todas as imagens atuais
  const allImages = [];
  const categories = ['lanches-especiais', 'lanches-tradicionais', 'porcoes', 'adicionais', 'bebidas'];
  
  for (const category of categories) {
    const categoryDir = path.join(uploadsDir, category);
    if (fs.existsSync(categoryDir)) {
      const files = fs.readdirSync(categoryDir);
      allImages.push(...files.map(file => path.join(category, file)));
    }
  }
  
  console.log(`\nOrganização de imagens concluída!`);
  console.log(`Estrutura atual:`);
  for (const category of categories) {
    const categoryDir = path.join(uploadsDir, category);
    if (fs.existsSync(categoryDir)) {
      const files = fs.readdirSync(categoryDir);
      console.log(`  ${category}: ${files.length} imagens`);
    }
  }
}

async function organizeImages() {
  try {
    const db = await open({
      filename: path.join(__dirname, 'db.sqlite'),
      driver: sqlite3.Database
    });
    
    console.log('Iniciando organização de imagens...');
    
    // Criar diretórios por categoria
    createCategoryDirectories();
    console.log('✓ Diretórios por categoria criados');
    
    // Mover e renomear imagens
    await moveAndRenameImages(db);
    
    // Limpar imagens antigas
    cleanupOldImages();
    
    await db.close();
    console.log('\n✅ Organização de imagens concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao organizar imagens:', error);
  }
}

organizeImages();