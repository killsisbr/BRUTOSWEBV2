// Script para debug de carregamento de imagens
console.log('Iniciando debug de imagens...');

// Função para testar carregamento de imagem
function testImageLoad(url, name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      console.log(`✅ Imagem ${name} carregada com sucesso:`, url);
      resolve(true);
    };
    img.onerror = (e) => {
      console.error(`❌ Erro ao carregar imagem ${name}:`, url, e);
      reject(false);
    };
    img.src = url;
  });
}

// Testar algumas imagens conhecidas
async function testKnownImages() {
  const imagesToTest = [
    { url: '/uploads/lanches-especiais/brutus-burguer.png', name: 'Brutus Burguer' },
    { url: '/uploads/lanches-especiais/brutus-salada.png', name: 'Brutus Salada' },
    { url: '/uploads/lanches-tradicionais/x-burguer.png', name: 'X-Burguer' }
  ];
  
  console.log('Testando carregamento de imagens conhecidas...');
  
  for (const image of imagesToTest) {
    try {
      await testImageLoad(image.url, image.name);
    } catch (error) {
      // Continuar testando as outras imagens
    }
  }
}

// Verificar produtos da API
async function checkAPIProducts() {
  try {
    console.log('Buscando produtos da API...');
    const response = await fetch('/api/produtos');
    const produtos = await response.json();
    
    console.log(`Encontrados ${produtos.length} produtos:`);
    
    // Verificar as primeiras 5 imagens
    for (let i = 0; i < Math.min(5, produtos.length); i++) {
      const produto = produtos[i];
      console.log(`Produto ${i + 1}:`, {
        id: produto.id,
        nome: produto.nome,
        imagem: produto.imagem,
        hasImagem: !!produto.imagem
      });
      
      if (produto.imagem) {
        try {
          // Testar carregamento da imagem
          await testImageLoad(produto.imagem, produto.nome);
        } catch (error) {
          // Continuar com os outros produtos
        }
      }
    }
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
  }
}

// Iniciar testes quando a página carregar
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM carregado, iniciando testes...');
  
  // Testar imagens conhecidas
  await testKnownImages();
  
  // Verificar produtos da API
  await checkAPIProducts();
  
  console.log('Testes concluídos.');
});