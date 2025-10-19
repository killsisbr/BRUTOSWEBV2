import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testImageAccess() {
  try {
    // Testar acesso a uma imagem específica
    const imageUrl = 'http://localhost:3005/uploads/imagem-1760659184375-587815905.jpg';
    console.log(`Testando acesso à imagem: ${imageUrl}`);
    
    const response = await axios.get(imageUrl, { 
      responseType: 'stream',
      timeout: 5000
    });
    
    console.log(`✓ Imagem acessível. Status: ${response.status}`);
    console.log(`  Content-Type: ${response.headers['content-type']}`);
    console.log(`  Content-Length: ${response.headers['content-length']} bytes`);
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('✗ Servidor não está respondendo. Verifique se o servidor está rodando.');
    } else if (error.response) {
      console.log(`✗ Erro ao acessar imagem. Status: ${error.response.status}`);
      console.log(`  Mensagem: ${error.response.statusText}`);
    } else {
      console.log(`✗ Erro ao testar acesso à imagem: ${error.message}`);
    }
  }
}

testImageAccess();