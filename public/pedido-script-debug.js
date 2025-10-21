// Estado da aplicação
let produtos = [];
let carrinho = [];
let produtosPorCategoria = {
  lanches: [],
  bebidas: [],
  porcoes: [],
  adicionais: []
};
let categoriaAtual = 'lanches';
let indiceProdutoAtual = 0;
let produtoSelecionado = null;
let quantidadeSelecionada = 1;
let observacaoAtual = '';
let adicionaisSelecionados = [];
let adicionaisParaItensCarrinho = {};
let whatsappId = null;
let clienteInfo = null;
let entregaInfo = null; // Informações de entrega

// Elementos do DOM
const elements = {
  currentProduct: document.getElementById('current-product'),
  prevProductBtn: document.getElementById('prev-product'),
  nextProductBtn: document.getElementById('next-product'),
  carouselDots: document.getElementById('carousel-dots'),
  cartIcon: document.getElementById('cart-icon'),
  cartCount: document.getElementById('cart-count'),
  cartCountModal: document.getElementById('cart-count-modal'),
  cartModal: document.getElementById('cart-modal'),
  cartItems: document.getElementById('cart-items'),
  cartTotal: document.getElementById('cart-total'),
  checkoutBtn: document.getElementById('checkout-btn'),
  checkoutModal: document.getElementById('checkout-modal'),
  orderItemsSummary: document.getElementById('order-items-summary'),
  orderTotal: document.getElementById('order-total'),
  confirmationModal: document.getElementById('confirmation-modal'),
  confirmOrderBtn: document.getElementById('confirm-order'),
  newOrderBtn: document.getElementById('new-order-btn'),
  closeButtons: document.querySelectorAll('.close-button'),
  // Elementos do modal de quantidade
  quantityModal: document.getElementById('quantity-modal'),
  quantityProductImage: document.getElementById('quantity-product-image'),
  quantityProductName: document.getElementById('quantity-product-name'),
  quantityProductPrice: document.getElementById('quantity-product-price'),
  selectedQuantity: document.getElementById('selected-quantity'),
  decreaseQuantityBtn: document.getElementById('decrease-quantity'),
  increaseQuantityBtn: document.getElementById('increase-quantity'),
  addToCartConfirmBtn: document.getElementById('add-to-cart-confirm'),
  observationInput: document.getElementById('observation-input'),
  additionalsSection: document.getElementById('additionals-section'),
  additionalsList: document.getElementById('additionals-list'),
  // Elementos do seletor de categorias
  categoryLanchesBtn: document.getElementById('category-lanches'),
  categoryBebidasBtn: document.getElementById('category-bebidas'),
  categoryPorcoesBtn: document.getElementById('category-porcoes'),
  // Elementos do formulário do cliente
  clientName: document.getElementById('client-name'),
  clientAddress: document.getElementById('client-address'),
  paymentMethod: document.getElementById('payment-method'),
  valorPago: document.getElementById('valor-pago'), // Novo elemento para valor pago
  dinheiroSection: document.getElementById('dinheiro-section'), // Seção para dinheiro
  usePreviousAddress: document.getElementById('use-previous-address'),
  previousAddress: document.getElementById('previous-address'),
  previousAddressText: document.getElementById('previousAddressText'),
  // Elementos de entrega
  useLocationBtn: document.getElementById('use-location-btn'),
  deliveryInfo: document.getElementById('delivery-info'),
  deliveryDistance: document.getElementById('delivery-distance'),
  deliveryPrice: document.getElementById('delivery-price'),
  deliveryError: document.getElementById('delivery-error'),
  clientCoordinates: document.getElementById('client-coordinates'),
  // Elementos da barra de pesquisa
  searchInput: document.getElementById('search-input'),
  searchButton: document.getElementById('search-button'),
  searchResults: document.getElementById('search-results')
};

// Verificar se todos os elementos foram encontrados
document.addEventListener('DOMContentLoaded', () => {
  console.log('Verificando elementos do DOM:');
  Object.keys(elements).forEach(key => {
    if (elements[key]) {
      console.log(`${key}: encontrado`);
    } else {
      console.error(`${key}: NÃO ENCONTRADO`);
    }
  });
  
  // Inicializar barra de pesquisa
  inicializarBarraPesquisa();
  
  // Verificar se há parâmetro de WhatsApp na URL
  const urlParams = new URLSearchParams(window.location.search);
  whatsappId = urlParams.get('whatsapp');
  
  if (whatsappId) {
    // Carregar informações do cliente do WhatsApp
    carregarClienteWhatsApp(whatsappId);
  }
  
  // Carregar produtos
  carregarProdutos();
});

// Atualizar estado dos botões do carrossel
function atualizarEstadoBotoes() {
  const produtosDaCategoria = produtosPorCategoria[categoriaAtual];
  
  if (produtosDaCategoria.length <= 1) {
    // Se houver 0 ou 1 produto, desativar ambos os botões
    if (elements.prevProductBtn) elements.prevProductBtn.disabled = true;
    if (elements.nextProductBtn) elements.nextProductBtn.disabled = true;
  } else {
    // Ativar ambos os botões
    if (elements.prevProductBtn) elements.prevProductBtn.disabled = false;
    if (elements.nextProductBtn) elements.nextProductBtn.disabled = false;
  }
  
  console.log('Estado dos botões atualizado');
}

// Função para carregar produtos
async function carregarProdutos() {
  try {
    console.log('Iniciando carregamento de produtos...');
    const res = await fetch('/api/produtos');
    console.log('Response status:', res.status);
    console.log('Response headers:', [...res.headers.entries()]);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const rawData = await res.text();
    console.log('Raw data received:', rawData);
    
    // Tentar parsear como JSON
    try {
      produtos = JSON.parse(rawData);
      console.log('Produtos carregados com sucesso:', produtos);
    } catch (parseError) {
      console.error('Erro ao parsear JSON:', parseError);
      console.error('Dados recebidos:', rawData);
      return;
    }
    
    // Verificar se produtos foram carregados corretamente
    if (!produtos || produtos.length === 0) {
      console.error('Nenhum produto encontrado ou erro no carregamento');
      return;
    }
    
    console.log('Total de produtos carregados:', produtos.length);
    
    // Verificar as imagens dos produtos
    produtos.forEach((produto, index) => {
      console.log(`Produto ${index + 1}:`, {
        id: produto.id,
        nome: produto.nome,
        imagem: produto.imagem,
        hasImagem: !!produto.imagem,
        imagemType: typeof produto.imagem
      });
    });
    
    // Organizar produtos por categoria
    organizarProdutosPorCategoria();
    
    // Inicializar carrossel
    atualizarCarrossel();
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Organizar produtos por categoria
function organizarProdutosPorCategoria() {
  console.log('Iniciando organização de produtos por categoria...');
  console.log('Produtos totais recebidos:', produtos);
  
  // Verificar se produtos existem
  if (!produtos || produtos.length === 0) {
    console.error('Nenhum produto para organizar');
    return;
  }
  
  console.log('Número total de produtos:', produtos.length);
  
  // Limpar categorias antes de reorganizar
  produtosPorCategoria = {
    lanches: [],
    bebidas: [],
    porcoes: [],
    adicionais: []
  };
  
  console.log('Categorias limpas, iniciando filtragem...');
  
  // Filtrar produtos por categoria
  produtos.forEach((produto, index) => {
    console.log(`Processando produto ${index + 1}:`, produto);
    console.log(`Categoria do produto ${index + 1}:`, produto.categoria);
    
    if (produto.categoria) {
      // Verificar se é um lanche
      if (produto.categoria.includes('Lanche') || 
          produto.categoria.includes('Lanches') || 
          produto.categoria.includes('Hambúrguer') || 
          produto.categoria.includes('Burger') ||
          produto.categoria.includes('Lanches Especiais') ||
          produto.categoria.includes('Lanches Tradicionais') ||
          produto.categoria.includes('Especiais') ||
          produto.categoria.includes('Tradicionais')) {
        produtosPorCategoria.lanches.push(produto);
        console.log('Produto adicionado aos lanches');
      }
      // Verificar se é uma bebida
      else if (produto.categoria.includes('Bebida') || 
               produto.categoria.includes('Bebidas') || 
               produto.categoria.includes('Refrigerante') || 
               produto.categoria.includes('Suco') ||
               produto.categoria.includes('Coca') ||
               produto.categoria.includes('Guaraná')) {
        produtosPorCategoria.bebidas.push(produto);
        console.log('Produto adicionado às bebidas');
      }
      // Verificar se é uma porção
      else if (produto.categoria.includes('Porção') || 
               produto.categoria.includes('Porções') || 
               produto.categoria.includes('Porcao') || 
               produto.categoria.includes('Porcoes') ||
               produto.categoria.includes('Batata') ||
               produto.categoria.includes('Onion') ||
               produto.categoria.includes('Calabresa')) {
        produtosPorCategoria.porcoes.push(produto);
        console.log('Produto adicionado às porções');
      }
      // Verificar se é um adicional
      else if (produto.categoria.includes('Adicional') || 
               produto.categoria.includes('Adicionais') || 
               produto.categoria.includes('Extra') ||
               produto.categoria.includes('Queijo') ||
               produto.categoria.includes('Bacon') ||
               produto.categoria.includes('Catupiry') ||
               produto.categoria.includes('Molho') ||
               produto.categoria.includes('Hambúrguer')) {
        produtosPorCategoria.adicionais.push(produto);
        console.log('Produto adicionado aos adicionais');
      }
      // Se não se encaixar em nenhuma categoria específica, adicionar aos lanches por padrão
      else {
        produtosPorCategoria.lanches.push(produto);
        console.log('Produto adicionado aos lanches (categoria padrão)');
      }
    } else {
      // Se não tiver categoria definida, adicionar aos lanches por padrão
      produtosPorCategoria.lanches.push(produto);
      console.log('Produto adicionado aos lanches (sem categoria definida)');
    }
  });
  
  console.log('Organização concluída. Produtos por categoria:', produtosPorCategoria);
  
  // Verificar se há produtos em cada categoria
  Object.keys(produtosPorCategoria).forEach(categoria => {
    console.log(`Categoria ${categoria}: ${produtosPorCategoria[categoria].length} produtos`);
    
    // Verificar as imagens dos produtos em cada categoria
    produtosPorCategoria[categoria].forEach((produto, index) => {
      console.log(`Produto na categoria ${categoria} ${index + 1}:`, {
        id: produto.id,
        nome: produto.nome,
        imagem: produto.imagem,
        hasImagem: !!produto.imagem
      });
    });
  });
}

// Atualizar carrossel com base na categoria selecionada
function atualizarCarrossel() {
  console.log('Iniciando atualização do carrossel...');
  console.log('Categoria atual:', categoriaAtual);
  const produtosDaCategoria = produtosPorCategoria[categoriaAtual];
  console.log('Produtos da categoria atual:', categoriaAtual, produtosDaCategoria);
  
  // Verificar se há produtos na categoria
  if (!produtosDaCategoria || produtosDaCategoria.length === 0) {
    console.log('Nenhum produto disponível nesta categoria');
    if (elements.currentProduct) {
      elements.currentProduct.innerHTML = `
        <div class="no-products">
          <p>Nenhum produto disponível nesta categoria</p>
        </div>
      `;
    }
    if (elements.carouselDots) {
      elements.carouselDots.innerHTML = '';
    }
    
    // Desativar botões quando não há produtos
    if (elements.prevProductBtn) elements.prevProductBtn.disabled = true;
    if (elements.nextProductBtn) elements.nextProductBtn.disabled = true;
    return;
  }
  
  console.log('Produtos encontrados na categoria, total:', produtosDaCategoria.length);
  
  // Garantir que o índice esteja dentro dos limites
  if (indiceProdutoAtual >= produtosDaCategoria.length) {
    indiceProdutoAtual = 0;
  }
  
  console.log('Índice do produto atual:', indiceProdutoAtual);
  renderizarProdutoAtual();
  renderizarIndicadoresCarrossel();
  
  // Atualizar estado dos botões
  atualizarEstadoBotoes();
}

// Renderizar produto atual no carrossel
function renderizarProdutoAtual() {
  const produtosDaCategoria = produtosPorCategoria[categoriaAtual];
  
  if (!produtosDaCategoria || produtosDaCategoria.length === 0) {
    console.log('Nenhum produto na categoria atual para renderizar');
    return;
  }
  
  const produto = produtosDaCategoria[indiceProdutoAtual];
  
  if (!elements.currentProduct) {
    console.error('Elemento currentProduct não encontrado');
    return;
  }
  
  // Log para debug
  console.log('Renderizando produto:', produto);
  console.log('Imagem do produto:', produto.imagem);
  
  // Verificar se a imagem é válida
  if (produto.imagem) {
    console.log('URL da imagem parece válida:', produto.imagem);
  } else {
    console.log('Produto sem imagem definida, usando placeholder');
  }
  
  // Verificar se a URL da imagem é relativa ou absoluta
  let imageUrl = produto.imagem || getPlaceholderSVG(300, 200, 'Imagem');
  if (imageUrl.startsWith('/')) {
    // Se for um caminho relativo, adicionar o host
    imageUrl = window.location.origin + imageUrl;
    console.log('URL da imagem ajustada para:', imageUrl);
  }
  
  elements.currentProduct.innerHTML = `
    <div class="product-card">
      <div class="product-image-container">
        <img src="${imageUrl}" 
             alt="${produto.nome}" 
             class="product-image" 
             onerror="console.error('Erro ao carregar imagem:', this.src); this.src='${getPlaceholderSVG(300, 200, 'Erro')}'; this.onerror=null;">
      </div>
      <div class="product-info">
        <h3 class="product-name">${produto.nome}</h3>
        <p class="product-description">${produto.descricao || 'Delicioso lanche preparado com ingredientes frescos'}</p>
        <div class="product-price">R$ ${produto.preco.toFixed(2).replace('.', ',')}</div>
        <button class="add-to-cart" data-id="${produto.id}">
          Adicionar ao Carrinho
        </button>
      </div>
    </div>
  `;
  
  // Verificar se a imagem foi renderizada corretamente
  const imgElement = elements.currentProduct.querySelector('.product-image');
  if (imgElement) {
    console.log('Elemento de imagem criado:', imgElement);
    console.log('Src da imagem:', imgElement.src);
    
    // Adicionar listeners para verificar o carregamento
    imgElement.addEventListener('load', function() {
      console.log('Imagem carregada com sucesso:', this.src);
    });
    
    imgElement.addEventListener('error', function(e) {
      console.error('Erro ao carregar imagem:', this.src, e);
    });
  } else {
    console.error('Elemento de imagem não encontrado após renderização');
  }
  
  // Atualizar indicadores ativos
  atualizarIndicadoresAtivos();
}

// Renderizar indicadores do carrossel
function renderizarIndicadoresCarrossel() {
  console.log('Iniciando renderização dos indicadores do carrossel...');
  const produtosDaCategoria = produtosPorCategoria[categoriaAtual];
  
  console.log('Produtos da categoria para indicadores:', produtosDaCategoria);
  
  if (!elements.carouselDots) {
    console.error('Elemento carouselDots não encontrado');
    return;
  }
  
  elements.carouselDots.innerHTML = '';
  
  if (!produtosDaCategoria || produtosDaCategoria.length === 0) {
    console.log('Nenhum indicador para renderizar - categoria vazia');
    return;
  }
  
  console.log('Número de indicadores a serem criados:', produtosDaCategoria.length);
  
  produtosDaCategoria.forEach((produto, index) => {
    const dot = document.createElement('div');
    dot.className = `dot ${index === indiceProdutoAtual ? 'active' : ''}`;
    dot.dataset.index = index;
    dot.addEventListener('click', () => {
      console.log('Clicou no indicador:', index);
      indiceProdutoAtual = index;
      renderizarProdutoAtual();
    });
    elements.carouselDots.appendChild(dot);
    console.log('Indicador criado para índice:', index, 'produto:', produto.nome);
  });
  
  console.log('Indicadores renderizados:', elements.carouselDots.children.length);
}

// Mostrar modal de seleção de quantidade
function mostrarModalQuantidade(produto) {
  elements.quantityProductImage.src = produto.imagem || getPlaceholderSVG(80, 80, 'Imagem');
  elements.quantityProductImage.alt = produto.nome;
  elements.quantityProductName.textContent = produto.nome;
  elements.quantityProductPrice.textContent = `R$ ${produto.preco.toFixed(2).replace('.', ',')}`;
  
  quantidadeSelecionada = 1;
  elements.selectedQuantity.textContent = quantidadeSelecionada;
  
  // Limpar observação e adicionais selecionados
  observacaoAtual = '';
  adicionaisSelecionados = [];
  elements.observationInput.value = '';
  
  // Carregar adicionais
  carregarAdicionais();
  
  mostrarModal(elements.quantityModal);
}

// Função para atualizar o preço exibido no modal de quantidade
function atualizarPrecoModalQuantidade() {
  if (produtoSelecionado) {
    // Calcular preço base
    let precoBase = produtoSelecionado.preco * quantidadeSelecionada;
    
    // Adicionar preço dos adicionais selecionados
    const precoAdicionais = adicionaisSelecionados.reduce((acc, adicional) => acc + adicional.preco, 0) * quantidadeSelecionada;
    
    // Calcular preço total
    const precoTotal = precoBase + precoAdicionais;
    
    // Atualizar exibição do preço
    elements.quantityProductPrice.textContent = `R$ ${precoTotal.toFixed(2).replace('.', ',')}`;
  }
}

// Carregar adicionais no modal
function carregarAdicionais() {
  // Não mostrar adicionais para bebidas
  const produtoNaCategoriaBebidas = produtosPorCategoria.bebidas.some(bebida => bebida.id === produtoSelecionado.id);
  
  // Mostrar seção de adicionais apenas se houver adicionais disponíveis e o produto não for uma bebida
  if (produtosPorCategoria.adicionais.length > 0 && !produtoNaCategoriaBebidas) {
    elements.additionalsSection.style.display = 'block';
    
    // Limpar lista de adicionais
    elements.additionalsList.innerHTML = '';
    
    // Adicionar cada adicional à lista
    produtosPorCategoria.adicionais.forEach(adicional => {
      const additionalItem = document.createElement('div');
      additionalItem.className = 'additional-item';
      additionalItem.innerHTML = `
        <input type="checkbox" id="additional-${adicional.id}" class="additional-checkbox" data-id="${adicional.id}">
        <div class="additional-info">
          <div class="additional-name">${adicional.nome}</div>
          <div class="additional-price">R$ ${adicional.preco.toFixed(2).replace('.', ',')}</div>
        </div>
      `;
      
      // Adicionar evento de mudança
      const checkbox = additionalItem.querySelector('.additional-checkbox');
      checkbox.addEventListener('change', (e) => {
        const adicionalId = parseInt(e.target.dataset.id);
        const adicional = produtosPorCategoria.adicionais.find(a => a.id === adicionalId);
        
        if (e.target.checked) {
          // Adicionar aos selecionados
          adicionaisSelecionados.push(adicional);
        } else {
          // Remover dos selecionados
          adicionaisSelecionados = adicionaisSelecionados.filter(a => a.id !== adicionalId);
        }
        
        // Atualizar o preço exibido no modal
        atualizarPrecoModalQuantidade();
        
        // REMOVIDO: Atualizar a seção de lanches do carrinho
      });
      
      elements.additionalsList.appendChild(additionalItem);
    });
  } else {
    elements.additionalsSection.style.display = 'none';
  }
}

// Atualizar quantidade selecionada
function atualizarQuantidade(delta) {
  const novaQuantidade = quantidadeSelecionada + delta;
  if (novaQuantidade >= 1 && novaQuantidade <= 99) {
    quantidadeSelecionada = novaQuantidade;
    elements.selectedQuantity.textContent = quantidadeSelecionada;
    
    // Atualizar o preço exibido no modal
    atualizarPrecoModalQuantidade();
  }
}

// Atualizar indicadores ativos
function atualizarIndicadoresAtivos() {
  console.log('Iniciando atualização dos indicadores ativos...');
  
  if (!elements.carouselDots) {
    console.error('Elemento carouselDots não encontrado');
    return;
  }
  
  const dots = elements.carouselDots.querySelectorAll('.dot');
  console.log('Número de dots encontrados:', dots.length);
  console.log('Índice do produto atual:', indiceProdutoAtual);
  
  dots.forEach((dot, index) => {
    if (index === indiceProdutoAtual) {
      dot.classList.add('active');
      console.log('Dot', index, 'ativado');
    } else {
      dot.classList.remove('active');
      console.log('Dot', index, 'desativado');
    }
  });
}

// Navegar para o próximo produto
function proximoProduto() {
  console.log('Navegando para o próximo produto');
  const produtosDaCategoria = produtosPorCategoria[categoriaAtual];
  
  if (!produtosDaCategoria || produtosDaCategoria.length === 0) {
    console.log('Nenhuma categoria ativa ou categoria vazia');
    return;
  }
  
  console.log('Índice atual:', indiceProdutoAtual);
  console.log('Total de produtos:', produtosDaCategoria.length);
  
  indiceProdutoAtual = (indiceProdutoAtual + 1) % produtosDaCategoria.length;
  console.log('Novo índice:', indiceProdutoAtual);
  
  renderizarProdutoAtual();
  atualizarEstadoBotoes();
}

// Navegar para o produto anterior
function produtoAnterior() {
  console.log('Navegando para o produto anterior');
  const produtosDaCategoria = produtosPorCategoria[categoriaAtual];
  
  if (!produtosDaCategoria || produtosDaCategoria.length === 0) {
    console.log('Nenhuma categoria ativa ou categoria vazia');
    return;
  }
  
  console.log('Índice atual:', indiceProdutoAtual);
  console.log('Total de produtos:', produtosDaCategoria.length);
  
  indiceProdutoAtual = (indiceProdutoAtual - 1 + produtosDaCategoria.length) % produtosDaCategoria.length;
  console.log('Novo índice:', indiceProdutoAtual);
  
  renderizarProdutoAtual();
  atualizarEstadoBotoes();
}

// Mudar categoria
function mudarCategoria(novaCategoria) {
  console.log('Mudando categoria para:', novaCategoria);
  
  // Verificar se os elementos de categoria existem
  if (!elements.categoryLanchesBtn || !elements.categoryBebidasBtn || !elements.categoryPorcoesBtn) {
    console.error('Elementos de categoria não encontrados');
    return;
  }
  
  // Atualizar botões
  elements.categoryLanchesBtn.classList.toggle('active', novaCategoria === 'lanches');
  elements.categoryBebidasBtn.classList.toggle('active', novaCategoria === 'bebidas');
  elements.categoryPorcoesBtn.classList.toggle('active', novaCategoria === 'porcoes');
  
  // Atualizar categoria atual
  categoriaAtual = novaCategoria;
  console.log('Categoria atual definida como:', categoriaAtual);
  
  // Resetar índice do produto
  indiceProdutoAtual = 0;
  console.log('Índice do produto resetado para:', indiceProdutoAtual);
  
  // Atualizar carrossel
  atualizarCarrossel();
}

// Adicionar produto ao carrinho
function adicionarAoCarrinho(produto, quantidade, observacao, adicionais) {
  // Verificar se há adicionais específicos para este produto
  let adicionaisParaEsteItem = [];
  
  // Se for um lanche, usar os adicionais selecionados no modal
  if (produtosPorCategoria.lanches.some(lanche => lanche.id === produto.id)) {
    adicionaisParaEsteItem = adicionaisSelecionados;
  } else {
    // Para não-lanches, usar os adicionais passados normalmente
    adicionaisParaEsteItem = adicionais || [];
  }
  
  carrinho.push({
    produto: produto,
    quantidade: quantidade,
    observacao: observacao,
    adicionais: adicionaisParaEsteItem
  });
  
  // Limpar os adicionais selecionados
  adicionaisSelecionados = [];
  
  atualizarCarrinho();
  mostrarNotificacao(`${quantidade}x ${produto.nome} adicionado(s) ao carrinho!`);
}

// Atualizar carrinho
function atualizarCarrinho() {
  // Atualizar contador do carrinho
  const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
  elements.cartCount.textContent = totalItens;
  elements.cartCountModal.textContent = totalItens;
  
  // Atualizar itens do carrinho no modal
  elements.cartItems.innerHTML = '';
  
  carrinho.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'cart-item';
    
    // Construir HTML do item
    let itemHTML = `
      <div class="cart-item-info">
        <div class="cart-item-name">${item.quantidade}x ${item.produto.nome}</div>
    `;
    
    // Adicionar adicionais se existirem
    if (item.adicionais && item.adicionais.length > 0) {
      const adicionaisText = item.adicionais.map(a => a.nome).join(', ');
      itemHTML += `<div class="cart-item-additionals">Adicionais: ${adicionaisText}</div>`;
    }
    
    // Adicionar observação se existir
    if (item.observacao) {
      itemHTML += `<div class="cart-item-observation">${item.observacao}</div>`;
    }
    
    // Calcular preço total do item (produto + adicionais)
    const precoProduto = item.produto.preco * item.quantidade;
    const precoAdicionais = item.adicionais.reduce((acc, adicional) => acc + adicional.preco, 0) * item.quantidade;
    const precoTotal = precoProduto + precoAdicionais;
    
    itemHTML += `
        <div class="cart-item-price">R$ ${precoTotal.toFixed(2).replace('.', ',')}</div>
      </div>
      <div class="cart-item-actions">
        <div class="quantity-control-cart">
          <button class="quantity-btn-cart decrease" data-index="${index}">-</button>
          <span class="quantity-cart">${item.quantidade}</span>
          <button class="quantity-btn-cart increase" data-index="${index}">+</button>
        </div>
        <button class="remove-item" data-index="${index}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    
    li.innerHTML = itemHTML;
    elements.cartItems.appendChild(li);
  });
  
  // Adicionar eventos aos botões de quantidade
  document.querySelectorAll('.quantity-btn-cart.decrease').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      if (carrinho[index].quantidade > 1) {
        carrinho[index].quantidade -= 1;
      } else {
        carrinho.splice(index, 1);
      }
      atualizarCarrinho();
    });
  });
  
  document.querySelectorAll('.quantity-btn-cart.increase').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      carrinho[index].quantidade += 1;
      atualizarCarrinho();
    });
  });
  
  document.querySelectorAll('.remove-item').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      carrinho.splice(index, 1);
      atualizarCarrinho();
    });
  });
  
  // Atualizar total
  const total = carrinho.reduce((sum, item) => {
    // Calcular preço do produto
    let precoProduto = item.produto.preco * item.quantidade;
    
    // Adicionar preço dos adicionais
    const precoAdicionais = item.adicionais.reduce((acc, adicional) => acc + adicional.preco, 0) * item.quantidade;
    
    return sum + precoProduto + precoAdicionais;
  }, 0);
  
  elements.cartTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
  elements.orderTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
  
  // Atualizar total com valor da entrega, se disponível
  if (entregaInfo && entregaInfo.price) {
    const totalComEntrega = total + entregaInfo.price;
    elements.cartTotal.textContent = `R$ ${totalComEntrega.toFixed(2).replace('.', ',')}`;
    elements.orderTotal.textContent = `R$ ${totalComEntrega.toFixed(2).replace('.', ',')}`;
  }
  
  // Atualizar resumo do pedido
  atualizarResumoPedido();
}

// Atualizar resumo do pedido
function atualizarResumoPedido() {
  elements.orderItemsSummary.innerHTML = '';
  
  carrinho.forEach(item => {
    const li = document.createElement('li');
    li.className = 'order-item-summary';
    
    // Construir HTML do item
    let itemHTML = `
      <div>
        <div>${item.quantidade}x ${item.produto.nome}</div>
    `;
    
    // Adicionar adicionais se existirem
    if (item.adicionais && item.adicionais.length > 0) {
      const adicionaisText = item.adicionais.map(a => a.nome).join(', ');
      itemHTML += `<div class="order-item-additionals">Adicionais: ${adicionaisText}</div>`;
    }
    
    // Adicionar observação se existir
    if (item.observacao) {
      itemHTML += `<div class="order-item-observation">${item.observacao}</div>`;
    }
    
    // Calcular preço total do item (produto + adicionais)
    const precoProduto = item.produto.preco * item.quantidade;
    const precoAdicionais = item.adicionais.reduce((acc, adicional) => acc + adicional.preco, 0) * item.quantidade;
    const precoTotal = precoProduto + precoAdicionais;
    
    itemHTML += `
      </div>
      <span>R$ ${precoTotal.toFixed(2).replace('.', ',')}</span>
    `;
    
    li.innerHTML = itemHTML;
    elements.orderItemsSummary.appendChild(li);
  });
  
  // Adicionar item de entrega no resumo, se disponível
  if (entregaInfo && entregaInfo.price) {
    const entregaItem = document.createElement('li');
    entregaItem.className = 'order-item-summary';
    entregaItem.innerHTML = `
      <div>
        <div>Entrega</div>
        <div>Distância: ${entregaInfo.distance.toFixed(2)} km</div>
      </div>
      <span>R$ ${entregaInfo.price.toFixed(2).replace('.', ',')}</span>
    `;
    elements.orderItemsSummary.appendChild(entregaItem);
  }
}

// Mostrar notificação
function mostrarNotificacao(mensagem) {
  // Criar elemento de notificação
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = mensagem;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #27ae60;
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 1001;
    animation: fadeInOut 3s ease;
  `;
  
  // Adicionar animação
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInOut {
      0% { opacity: 0; bottom: 0; }
      10% { opacity: 1; bottom: 20px; }
      90% { opacity: 1; bottom: 20px; }
      100% { opacity: 0; bottom: 0; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // Remover notificação após 3 segundos
  setTimeout(() => {
    notification.remove();
    style.remove();
  }, 3000);
}

// Mostrar modal
function mostrarModal(modal) {
  modal.classList.add('show');
  // Removido o bloqueio de scroll para permitir rolagem na página
}

// Fechar modal
function fecharModal(modal) {
  modal.classList.remove('show');
  // Removido o controle de scroll para permitir rolagem na página
}

// Função para gerar SVG placeholder inline
function getPlaceholderSVG(width, height, text = '') {
  // Codificar o texto para uso em SVG
  const encodedText = encodeURIComponent(text);
  
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='100%25' height='100%25' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='${Math.min(width, height) / 8}' fill='%23666'%3E${encodedText}%3C/text%3E%3C/svg%3E`;
}

// Carregar informações do cliente via WhatsApp ID
async function carregarClienteInfo() {
  if (!whatsappId) return;
  
  try {
    const res = await fetch(`/api/clientes/${encodeURIComponent(whatsappId)}`);
    const data = await res.json();
    
    if (data.success && data.cliente) {
      clienteInfo = data.cliente;
      
      // Preencher campos do formulário com dados salvos
      elements.clientName.value = clienteInfo.nome || '';
      elements.clientAddress.value = clienteInfo.endereco || '';
      
      // Preencher automaticamente as informações salvas
      if (clienteInfo.nome) {
        elements.clientName.value = clienteInfo.nome;
      }
      
      // Telefone não é necessário preencher novamente pois veio pelo WhatsApp
      
      // Mostrar opção para usar endereço anterior
      if (clienteInfo.endereco) {
        elements.previousAddressText.textContent = `Usar endereço anterior: ${clienteInfo.endereco}`;
        elements.previousAddress.style.display = 'block';
        
        // Preencher endereço automaticamente, mas permitir alteração
        elements.clientAddress.value = clienteInfo.endereco;
      }
    }
  } catch (error) {
    console.error('Erro ao carregar informações do cliente:', error);
  }
}

// Salvar informações do cliente
async function salvarClienteInfo() {
  if (!whatsappId) return;
  
  const clienteData = {
    whatsappId: whatsappId,
    nome: elements.clientName.value,
    endereco: elements.clientAddress.value
  };
  
  try {
    const res = await fetch('/api/clientes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(clienteData)
    });
    
    const data = await res.json();
    
    if (data.success) {
      console.log('Informações do cliente salvas com sucesso');
    }
  } catch (error) {
    console.error('Erro ao salvar informações do cliente:', error);
  }
}

// Event Listeners
elements.cartIcon.addEventListener('click', () => {
  mostrarModal(elements.cartModal);
});

elements.checkoutBtn.addEventListener('click', () => {
  if (carrinho.length === 0) {
    mostrarNotificacao('Adicione itens ao carrinho antes de finalizar!');
    return;
  }
  fecharModal(elements.cartModal);
  mostrarModal(elements.checkoutModal);
  // Inicializar a seção de dinheiro com base no método de pagamento padrão
  if (elements.paymentMethod.value === 'dinheiro') {
    elements.dinheiroSection.style.display = 'block';
  } else {
    elements.dinheiroSection.style.display = 'none';
    elements.valorPago.value = '';
  }
});

// Adicionar evento para mudança de método de pagamento
elements.paymentMethod.addEventListener('change', () => {
  if (elements.paymentMethod.value === 'dinheiro') {
    elements.dinheiroSection.style.display = 'block';
  } else {
    elements.dinheiroSection.style.display = 'none';
    elements.valorPago.value = '';
  }
});

elements.confirmOrderBtn.addEventListener('click', async () => {
  if (carrinho.length === 0) return;
  
  // Validar campos obrigatórios (telefone não é obrigatório pois já veio pelo WhatsApp)
  if (!elements.clientName.value || !elements.clientAddress.value) {
    mostrarNotificacao('Por favor, preencha seu nome e endereço!');
    return;
  }
  
  // Se já tem endereço salvo e não digitou um novo, usar o salvo
  if (clienteInfo && clienteInfo.endereco && !elements.clientAddress.value) {
    elements.clientAddress.value = clienteInfo.endereco;
  }
  
  // Verificar se o usuário quer usar o endereço anterior
  if (elements.usePreviousAddress.checked && clienteInfo && clienteInfo.endereco) {
    elements.clientAddress.value = clienteInfo.endereco;
  }
  
  // Validar valor pago se for dinheiro e a seção estiver visível
  if (elements.paymentMethod.value === 'dinheiro' && elements.dinheiroSection.style.display === 'block') {
    const valorPago = parseFloat(elements.valorPago.value);
    const totalPedido = calcularTotalPedido();
    
    // Verificar se o valor é 0 ou 0,00 (cliente quer troco)
    if (isNaN(valorPago) || valorPago < 0) {
      mostrarNotificacao('Por favor, informe o valor pago em dinheiro!');
      return;
    }
    
    if (valorPago > 0 && valorPago < totalPedido) {
      mostrarNotificacao('O valor pago deve ser maior ou igual ao total do pedido!');
      return;
    }
  }
  
  // Preparar dados do cliente para salvar no banco
  const clienteData = {
    nome: elements.clientName.value,
    endereco: elements.clientAddress.value,
    whatsappId: whatsappId,
    pagamento: elements.paymentMethod.value,
    troco: elements.paymentMethod.value === 'dinheiro' ? parseFloat(elements.valorPago.value) : null
  };
  
  // Salvar/atualizar informações do cliente no banco
  await salvarClienteInfo();
  
  // Preparar dados do pedido
  const pedidoData = {
    cliente: clienteData,
    itens: carrinho,
    total: calcularTotalPedido(),
    entrega: entregaInfo
  };
  
  try {
    const res = await fetch('/api/pedidos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pedidoData)
    });
    
    const data = await res.json();
    
    if (data.success) {
      // Fechar modal de checkout e mostrar confirmação
      fecharModal(elements.checkoutModal);
      mostrarModal(elements.confirmationModal);
      
      // Limpar carrinho
      carrinho = [];
      atualizarCarrinho();
      
      // Limpar informações de entrega
      entregaInfo = null;
      if (elements.deliveryInfo) {
        elements.deliveryInfo.style.display = 'none';
      }
      if (elements.deliveryError) {
        elements.deliveryError.style.display = 'none';
      }
      if (elements.clientCoordinates) {
        elements.clientCoordinates.value = '';
      }
    } else {
      mostrarNotificacao('Erro ao criar pedido. Tente novamente.');
    }
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    mostrarNotificacao('Erro ao criar pedido. Tente novamente.');
  }
});

// Calcular total do pedido (itens + entrega)
function calcularTotalPedido() {
  const totalItens = carrinho.reduce((sum, item) => {
    let precoProduto = item.produto.preco * item.quantidade;
    const precoAdicionais = item.adicionais.reduce((acc, adicional) => acc + adicional.preco, 0) * item.quantidade;
    return sum + precoProduto + precoAdicionais;
  }, 0);
  
  // Adicionar valor da entrega, se disponível
  if (entregaInfo && entregaInfo.price) {
    return totalItens + entregaInfo.price;
  }
  
  return totalItens;
}

elements.newOrderBtn.addEventListener('click', () => {
  fecharModal(elements.confirmationModal);
});

// Controles do seletor de categorias
if (elements.categoryLanchesBtn) {
  elements.categoryLanchesBtn.addEventListener('click', () => {
    console.log('Botão de lanches clicado');
    mudarCategoria('lanches');
  });
} else {
  console.error('Botão de lanches não encontrado');
}

if (elements.categoryBebidasBtn) {
  elements.categoryBebidasBtn.addEventListener('click', () => {
    console.log('Botão de bebidas clicado');
    mudarCategoria('bebidas');
  });
} else {
  console.error('Botão de bebidas não encontrado');
}

if (elements.categoryPorcoesBtn) {
  elements.categoryPorcoesBtn.addEventListener('click', () => {
    console.log('Botão de porções clicado');
    mudarCategoria('porcoes');
  });
} else {
  console.error('Botão de porções não encontrado');
}

// Controles do carrossel
if (elements.prevProductBtn) {
  elements.prevProductBtn.addEventListener('click', () => {
    console.log('Botão anterior clicado');
    produtoAnterior();
  });
} else {
  console.error('Botão anterior não encontrado');
}

if (elements.nextProductBtn) {
  elements.nextProductBtn.addEventListener('click', () => {
    console.log('Botão próximo clicado');
    proximoProduto();
  });
} else {
  console.error('Botão próximo não encontrado');
}

// Controles do modal de quantidade
elements.decreaseQuantityBtn.addEventListener('click', () => {
  atualizarQuantidade(-1);
});

elements.increaseQuantityBtn.addEventListener('click', () => {
  atualizarQuantidade(1);
});

elements.addToCartConfirmBtn.addEventListener('click', () => {
  if (produtoSelecionado) {
    observacaoAtual = elements.observationInput.value.trim();
    adicionarAoCarrinho(produtoSelecionado, quantidadeSelecionada, observacaoAtual, adicionaisSelecionados);
    fecharModal(elements.quantityModal);
  }
});

// Controles do seletor de categorias
elements.categoryLanchesBtn.addEventListener('click', () => {
  console.log('Botão de lanches clicado');
  mudarCategoria('lanches');
});

elements.categoryBebidasBtn.addEventListener('click', () => {
  console.log('Botão de bebidas clicado');
  mudarCategoria('bebidas');
});

elements.categoryPorcoesBtn.addEventListener('click', () => {
  console.log('Botão de porções clicado');
  mudarCategoria('porcoes');
});

// Fechar modais com botão X
elements.closeButtons.forEach(button => {
  button.addEventListener('click', () => {
    const modal = button.closest('.modal');
    fecharModal(modal);
  });
});

// Fechar modais ao clicar fora
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      fecharModal(modal);
    }
  });
});

// Função para inicializar a barra de pesquisa
function inicializarBarraPesquisa() {
  // Adicionar evento de digitação no campo de pesquisa
  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', debounce(pesquisarProdutos, 300));
  }
  
  // Adicionar evento de clique no botão de pesquisa
  if (elements.searchButton) {
    elements.searchButton.addEventListener('click', () => {
      pesquisarProdutos();
    });
  }
  
  // Adicionar evento de clique fora da barra de pesquisa para fechar os resultados
  document.addEventListener('click', (event) => {
    if (elements.searchInput && elements.searchButton && elements.searchResults &&
        !elements.searchInput.contains(event.target) && 
        !elements.searchButton.contains(event.target) && 
        !elements.searchResults.contains(event.target)) {
      elements.searchResults.style.display = 'none';
    }
  });
}

// Função para pesquisar produtos
function pesquisarProdutos() {
  // Verificar se os elementos existem
  if (!elements.searchInput || !elements.searchResults) {
    return;
  }
  
  const termo = elements.searchInput.value.toLowerCase().trim();
  
  // Se o termo estiver vazio, esconder os resultados
  if (termo === '') {
    elements.searchResults.style.display = 'none';
    return;
  }
  
  // Filtrar produtos que correspondem ao termo de pesquisa
  const resultados = produtos.filter(produto => 
    produto.nome.toLowerCase().includes(termo) || 
    (produto.descricao && produto.descricao.toLowerCase().includes(termo))
  );
  
  // Renderizar resultados
  renderizarResultadosPesquisa(resultados);
}

// Função para renderizar resultados da pesquisa
function renderizarResultadosPesquisa(resultados) {
  // Verificar se o elemento de resultados existe
  if (!elements.searchResults) {
    return;
  }
  
  // Limitar a 10 resultados
  const resultadosLimitados = resultados.slice(0, 10);
  
  if (resultadosLimitados.length === 0) {
    elements.searchResults.innerHTML = '<div class="search-result-item">Nenhum produto encontrado</div>';
    elements.searchResults.style.display = 'block';
    return;
  }
  
  elements.searchResults.innerHTML = resultadosLimitados.map(produto => `
    <div class="search-result-item" data-id="${produto.id}">
      <div class="search-result-image" style="background-image: url('${produto.imagem || ''}')"></div>
      <div class="search-result-info">
        <div class="search-result-name">${produto.nome}</div>
        <div class="search-result-price">R$ ${produto.preco.toFixed(2).replace('.', ',')}</div>
      </div>
    </div>
  `).join('');
  
  elements.searchResults.style.display = 'block';
  
  // Adicionar eventos de clique aos resultados
  document.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const produtoId = parseInt(item.dataset.id);
      const produto = produtos.find(p => p.id === produtoId);
      
      if (produto) {
        // Fechar resultados da pesquisa
        elements.searchResults.style.display = 'none';
        elements.searchInput.value = '';
        
        // Encontrar a categoria do produto
        let categoriaProduto = 'lanches';
        if (produto.categoria.includes('Bebida') || produto.categoria.includes('Bebidas') || 
            produto.categoria.includes('Refrigerante') || produto.categoria.includes('Suco')) {
          categoriaProduto = 'bebidas';
        } else if (produto.categoria.includes('Porção') || produto.categoria.includes('Porções') || 
                   produto.categoria.includes('Porcao') || produto.categoria.includes('Porcoes')) {
          categoriaProduto = 'porcoes';
        }
        
        // Mudar para a categoria do produto
        mudarCategoria(categoriaProduto);
        
        // Encontrar o índice do produto na categoria
        const indice = produtosPorCategoria[categoriaProduto].findIndex(p => p.id === produtoId);
        if (indice !== -1) {
          indiceProdutoAtual = indice;
          atualizarCarrossel();
        }
      }
    });
  });
}

// Função debounce para limitar a frequência de chamadas
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM completamente carregado');
  
  // Verificar se os elementos principais existem
  if (!elements.currentProduct) {
    console.error('Elemento currentProduct não encontrado');
    return;
  }
  
  if (!elements.carouselDots) {
    console.error('Elemento carouselDots não encontrado');
    return;
  }
  
  if (!elements.prevProductBtn || !elements.nextProductBtn) {
    console.error('Botões do carrossel não encontrados');
    return;
  }
  
  console.log('Todos os elementos principais encontrados');
  
  // Obter WhatsApp ID da sessionStorage ou da URL
  whatsappId = sessionStorage.getItem('whatsappId');
  
  // Se não estiver na sessionStorage, tentar obter da URL
  if (!whatsappId) {
    const urlParams = new URLSearchParams(window.location.search);
    whatsappId = urlParams.get('whatsapp');
    
    // Se encontrou na URL, armazenar na sessionStorage e remover da URL
    if (whatsappId) {
      sessionStorage.setItem('whatsappId', whatsappId);
      
      // Remover o parâmetro da URL sem recarregar a página
      const url = new URL(window.location);
      url.searchParams.delete('whatsapp');
      window.history.replaceState({}, document.title, url);
    }
  }
  
  console.log('WhatsApp ID:', whatsappId);
  
  await carregarProdutos();
  
  // Carregar informações do cliente se houver WhatsApp ID
  if (whatsappId) {
    await carregarClienteInfo();
  }
  
  // Adicionar evento para o botão de usar localização
  if (elements.useLocationBtn) {
    elements.useLocationBtn.addEventListener('click', usarLocalizacao);
  }
  
  // Delegação de eventos para o botão "Adicionar ao Carrinho"
  elements.currentProduct.addEventListener('click', (e) => {
    // Verificar se o clique foi no botão "Adicionar ao Carrinho"
    if (e.target.classList.contains('add-to-cart')) {
      e.preventDefault();
      e.stopPropagation();
      const produtoId = parseInt(e.target.dataset.id);
      produtoSelecionado = produtos.find(p => p.id === produtoId);
      if (produtoSelecionado) {
        mostrarModalQuantidade(produtoSelecionado);
      }
    }
  });
  
  // Também adicionar delegação para eventos de toque
  elements.currentProduct.addEventListener('touchend', (e) => {
    // Verificar se o toque foi no botão "Adicionar ao Carrinho"
    if (e.target.classList.contains('add-to-cart')) {
      // Prevenir o comportamento padrão para evitar conflitos
      e.preventDefault();
      e.stopPropagation();
      
      // Tratar como clique direto
      const produtoId = parseInt(e.target.dataset.id);
      produtoSelecionado = produtos.find(p => p.id === produtoId);
      if (produtoSelecionado) {
        mostrarModalQuantidade(produtoSelecionado);
      }
      
      return;
    }
  });
  
  // Adicionar eventos swipe para o carrossel (swipe) - FUNCIONALIDADE TEMPORARIAMENTE DESABILITADA
  adicionarEventosSwipe();
  
  // Adicionar navegação por botões como alternativa
  console.log('Adicionando event listeners aos botões do carrossel');
  console.log('Prev button:', elements.prevProductBtn);
  console.log('Next button:', elements.nextProductBtn);
  
  if (elements.prevProductBtn && elements.nextProductBtn) {
    elements.prevProductBtn.addEventListener('click', produtoAnterior);
    elements.nextProductBtn.addEventListener('click', proximoProduto);
    console.log('Event listeners adicionados com sucesso');
  } else {
    console.error('Não foi possível adicionar event listeners aos botões do carrossel');
  }
  
  console.log('Aplicação inicializada com sucesso');
});

// Adicionar eventos swipe para o carrossel - FUNCIONALIDADE TEMPORARIAMENTE DESABILITADA
function adicionarEventosSwipe() {
  const carouselElement = elements.currentProduct;
  const bodyElement = document.body;
  
  console.log('Adicionando eventos de swipe');
  console.log('Carousel element:', carouselElement);
  console.log('Body element:', bodyElement);
  
  // Eventos para swipe para cima (abrir carrinho) - MANTIDO
  if (bodyElement) {
    bodyElement.addEventListener('touchstart', handleTouchStartCart, false);
    bodyElement.addEventListener('touchmove', handleTouchMoveCart, false);
    bodyElement.addEventListener('touchend', handleTouchEndCart, false);
    bodyElement.addEventListener('touchcancel', handleTouchEndCart, false);
    console.log('Eventos de swipe para carrinho adicionados');
  }
  
  // Prevenir seleção de texto durante o swipe
  if (carouselElement) {
    carouselElement.addEventListener('selectstart', (e) => {
      // Permitir seleção de texto em inputs e textareas
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return true;
      }
      e.preventDefault();
    }, false);
    console.log('Evento de prevenção de seleção adicionado');
  }
}

// Variáveis para pointer events (REMOVIDO TEMPORARIAMENTE)
let isPointerDown = false;
let pointerStartX = 0;
let pointerStartY = 0;
let isSwipeDetected = false;

// Funções para pointer events (melhor suporte cross-platform) - REMOVIDO TEMPORARIAMENTE
function handlePointerDown(e) {
  // Funcionalidade de swipe temporariamente desativada
  return;
}

function handlePointerMove(e) {
  // Funcionalidade de swipe temporariamente desativada
  return;
}

function handlePointerUp(e) {
  // Funcionalidade de swipe temporariamente desativada
  return;
}

// Funções para touch - REMOVIDO TEMPORARIAMENTE
function handleTouchStart(e) {
  // Funcionalidade de swipe temporariamente desativada
  console.log('Swipe functionality temporarily disabled');
  return;
}

function handleTouchMove(e) {
  // Funcionalidade de swipe temporariamente desativada
  console.log('Swipe functionality temporarily disabled');
  return;
}

function handleTouchEnd(e) {
  // Funcionalidade de swipe temporariamente desativada
  console.log('Swipe functionality temporarily disabled');
  return;
}

function handleMouseDown(e) {
  // Funcionalidade de swipe temporariamente desativada
  console.log('Swipe functionality temporarily disabled');
  return;
}

function handleMouseMove(e) {
  // Funcionalidade de swipe temporariamente desativada
  console.log('Swipe functionality temporarily disabled');
  return;
}

function handleMouseUp(e) {
  // Funcionalidade de swipe temporariamente desativada
  console.log('Swipe functionality temporarily disabled');
  return;
}

function handleMouseLeave() {
  // Funcionalidade de swipe temporariamente desativada
  console.log('Swipe functionality temporarily disabled');
  return;
}

// Função para processar o gesto de swipe - REMOVIDO TEMPORARIAMENTE
function handleSwipeGesture() {
  // Funcionalidade de swipe temporariamente desativada
  console.log('Swipe functionality temporarily disabled');
  return;
}

// Funções para touch do carrinho (swipe para cima) - MANTIDO PARA FUNCIONALIDADE DE ABRIR CARRINHO
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;

function handleTouchStartCart(e) {
  console.log('Touch start no carrinho');
  // Verificar se é um evento de toque
  if (e.touches && e.touches.length > 0) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    console.log('Touch start coordinates:', touchStartX, touchStartY);
  }
}

function handleTouchMoveCart(e) {
  console.log('Touch move no carrinho');
  if (!touchStartX) return;
  
  // Verificar se é um evento de toque
  if (e.touches && e.touches.length > 0) {
    touchEndX = e.touches[0].clientX;
    touchEndY = e.touches[0].clientY;
    console.log('Touch move coordinates:', touchEndX, touchEndY);
  }
}

function handleTouchEndCart(e) {
  console.log('Touch end no carrinho');
  // Processar apenas swipe para cima (abrir carrinho)
  if (touchStartY && touchEndY) {
    const diffY = touchStartY - touchEndY;
    const diffX = Math.abs(touchStartX - touchEndX);
    
    console.log('Diferença Y:', diffY);
    console.log('Diferença X:', diffX);
    
    // Verificar se é um swipe para cima significativo
    // e se o movimento horizontal não é maior que o vertical
    if (diffY > 50 && diffX < 100) {
      console.log('Swipe para cima detectado - abrindo carrinho');
      // Abrir o carrinho
      mostrarModal(elements.cartModal);
    }
  }
  
  // Resetar valores
  touchStartX = 0;
  touchEndX = 0;
  touchStartY = 0;
  touchEndY = 0;
  console.log('Valores de touch resetados');
}

// Função para processar o gesto de swipe para cima (removida)

// Função para usar a localização do usuário
function usarLocalizacao() {
  if (navigator.geolocation) {
    // Mostrar mensagem de carregamento
    if (elements.deliveryError) {
      elements.deliveryError.textContent = 'Obtendo sua localização...';
      elements.deliveryError.style.display = 'block';
      elements.deliveryInfo.style.display = 'none';
    }
    
    navigator.geolocation.getCurrentPosition(
      position => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        
        // Calcular entrega com as coordenadas obtidas
        calcularEntrega(latitude, longitude);
      },
      error => {
        tratarErroLocalizacao(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  } else {
    if (elements.deliveryError) {
      elements.deliveryError.textContent = 'Geolocalização não é suportada pelo seu navegador.';
      elements.deliveryError.style.display = 'block';
    }
  }
}

// Calcular valor da entrega
async function calcularEntrega(latitude, longitude) {
  try {
    const response = await fetch('/api/entrega/calcular', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ latitude, longitude })
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (data.error) {
        // Fora da área de entrega
        if (elements.deliveryError) {
          elements.deliveryError.textContent = data.error;
          elements.deliveryError.style.display = 'block';
          elements.deliveryInfo.style.display = 'none';
        }
      } else {
        // Entrega válida
        entregaInfo = {
          distance: data.distance,
          price: data.price,
          coordinates: { lat: latitude, lng: longitude }
        };
        
        if (elements.deliveryInfo) {
          elements.deliveryDistance.textContent = data.distance.toFixed(2);
          elements.deliveryPrice.textContent = data.price.toFixed(2).replace('.', ',');
          elements.deliveryInfo.style.display = 'block';
          elements.deliveryError.style.display = 'none';
        }
        
        // Salvar coordenadas no elemento hidden
        if (elements.clientCoordinates) {
          elements.clientCoordinates.value = JSON.stringify({ lat: latitude, lng: longitude });
        }
        
        // Atualizar totais com o valor da entrega
        atualizarCarrinho();
      }
    } else {
      if (elements.deliveryError) {
        elements.deliveryError.textContent = data.error || 'Erro ao calcular entrega.';
        elements.deliveryError.style.display = 'block';
        elements.deliveryInfo.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Erro ao calcular entrega:', error);
    if (elements.deliveryError) {
      elements.deliveryError.textContent = 'Erro ao calcular valor da entrega. Por favor, tente novamente.';
      elements.deliveryError.style.display = 'block';
      elements.deliveryInfo.style.display = 'none';
    }
  }
}

// Tratar erros de localização
function tratarErroLocalizacao(error) {
  let errorMessage = '';
  
  switch (error.code) {
    case error.PERMISSION_DENIED:
      errorMessage = 'Permissão para acessar localização negada. Por favor, habilite o acesso à localização nas configurações do seu navegador.';
      break;
    case error.POSITION_UNAVAILABLE:
      errorMessage = 'Informação de localização indisponível. Por favor, tente novamente.';
      break;
    case error.TIMEOUT:
      errorMessage = 'Tempo limite para obter localização esgotado. Por favor, tente novamente.';
      break;
    default:
      errorMessage = 'Erro desconhecido ao obter localização.';
      break;
  }
  
  if (elements.deliveryError) {
    elements.deliveryError.textContent = errorMessage;
    elements.deliveryError.style.display = 'block';
    elements.deliveryInfo.style.display = 'none';
  }
}

// Atualizar estado dos botões do carrossel
function atualizarEstadoBotoes() {
  console.log('Iniciando atualização do estado dos botões do carrossel...');
  const produtosDaCategoria = produtosPorCategoria[categoriaAtual];
  
  console.log('Produtos da categoria atual:', produtosDaCategoria);
  console.log('Número de produtos:', produtosDaCategoria ? produtosDaCategoria.length : 'undefined');
  
  if (!elements.prevProductBtn || !elements.nextProductBtn) {
    console.error('Botões do carrossel não encontrados');
    return;
  }
  
  if (!produtosDaCategoria || produtosDaCategoria.length <= 1) {
    // Se houver 0 ou 1 produto, desativar ambos os botões
    console.log('Desativando botões - 0 ou 1 produto');
    elements.prevProductBtn.disabled = true;
    elements.nextProductBtn.disabled = true;
    console.log('Botão anterior desativado:', elements.prevProductBtn.disabled);
    console.log('Botão próximo desativado:', elements.nextProductBtn.disabled);
  } else {
    // Ativar ambos os botões
    console.log('Ativando botões - mais de 1 produto');
    elements.prevProductBtn.disabled = false;
    elements.nextProductBtn.disabled = false;
    console.log('Botão anterior ativado:', !elements.prevProductBtn.disabled);
    console.log('Botão próximo ativado:', !elements.nextProductBtn.disabled);
  }
}