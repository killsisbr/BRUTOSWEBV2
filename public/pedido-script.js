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
  // REMOVIDO: clientPhone: document.getElementById('client-phone'),
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
  clientCoordinates: document.getElementById('client-coordinates')
};

// Função para carregar produtos
async function carregarProdutos() {
  try {
    const res = await fetch('/api/produtos');
    produtos = await res.json();
    
    // Organizar produtos por categoria
    organizarProdutosPorCategoria();
    
    // Inicializar carrossel
    atualizarCarrossel();
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
  }
}

// Organizar produtos por categoria
function organizarProdutosPorCategoria() {
  produtosPorCategoria.lanches = produtos.filter(produto => 
    produto.categoria.includes('Lanche') || produto.categoria.includes('Lanches') || produto.categoria.includes('Hambúrguer') || produto.categoria.includes('Burger')
  );
  
  produtosPorCategoria.bebidas = produtos.filter(produto => 
    produto.categoria.includes('Bebida') || produto.categoria.includes('Bebidas') || produto.categoria.includes('Refrigerante') || produto.categoria.includes('Suco')
  );
  
  produtosPorCategoria.porcoes = produtos.filter(produto => 
    produto.categoria.includes('Porção') || produto.categoria.includes('Porções') || produto.categoria.includes('Porcao') || produto.categoria.includes('Porcoes')
  );
  
  // Adicionando filtro para adicionais
  produtosPorCategoria.adicionais = produtos.filter(produto => 
    produto.categoria.includes('Adicional') || produto.categoria.includes('Adicionais') || produto.categoria.includes('Extra')
  );
  
  // Se alguma categoria estiver vazia, usar todos os produtos
  if (produtosPorCategoria.lanches.length === 0) {
    produtosPorCategoria.lanches = produtos;
  }
}

// Atualizar carrossel com base na categoria selecionada
function atualizarCarrossel() {
  const produtosDaCategoria = produtosPorCategoria[categoriaAtual];
  
  if (produtosDaCategoria.length > 0) {
    // Garantir que o índice esteja dentro dos limites
    if (indiceProdutoAtual >= produtosDaCategoria.length) {
      indiceProdutoAtual = 0;
    }
    
    renderizarProdutoAtual();
    renderizarIndicadoresCarrossel();
    
    // Atualizar estado dos botões
    atualizarEstadoBotoes();
  } else {
    // Se não houver produtos na categoria, mostrar mensagem
    elements.currentProduct.innerHTML = `
      <div class="no-products">
        <p>Nenhum produto disponível nesta categoria</p>
      </div>
    `;
    elements.carouselDots.innerHTML = '';
    
    // Desativar botões quando não há produtos
    if (elements.prevProductBtn) elements.prevProductBtn.disabled = true;
    if (elements.nextProductBtn) elements.nextProductBtn.disabled = true;
  }
}

// Renderizar produto atual no carrossel
function renderizarProdutoAtual() {
  const produtosDaCategoria = produtosPorCategoria[categoriaAtual];
  
  if (produtosDaCategoria.length === 0) return;
  
  const produto = produtosDaCategoria[indiceProdutoAtual];
  
  elements.currentProduct.innerHTML = `
    <div class="product-card">
      <div class="product-image-container">
        <img src="${produto.imagem || getPlaceholderSVG(300, 200, 'Imagem')}" 
             alt="${produto.nome}" 
             class="product-image" 
             onerror="this.src='${getPlaceholderSVG(300, 200, 'Erro')}'; this.onerror=null;">
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
  
  // Atualizar indicadores ativos
  atualizarIndicadoresAtivos();
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
        
        // Atualizar a seção de lanches do carrinho
        atualizarLanchesNoCarrinho();
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

// Renderizar indicadores do carrossel
function renderizarIndicadoresCarrossel() {
  const produtosDaCategoria = produtosPorCategoria[categoriaAtual];
  
  elements.carouselDots.innerHTML = '';
  
  produtosDaCategoria.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.className = `dot ${index === indiceProdutoAtual ? 'active' : ''}`;
    dot.dataset.index = index;
    dot.addEventListener('click', () => {
      indiceProdutoAtual = index;
      renderizarProdutoAtual();
    });
    elements.carouselDots.appendChild(dot);
  });
}

// Atualizar indicadores ativos
function atualizarIndicadoresAtivos() {
  const dots = elements.carouselDots.querySelectorAll('.dot');
  dots.forEach((dot, index) => {
    if (index === indiceProdutoAtual) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

// Navegar para o próximo produto
function proximoProduto() {
  const produtosDaCategoria = produtosPorCategoria[categoriaAtual];
  
  if (produtosDaCategoria.length === 0) return;
  
  indiceProdutoAtual = (indiceProdutoAtual + 1) % produtosDaCategoria.length;
  renderizarProdutoAtual();
  atualizarEstadoBotoes();
}

// Navegar para o produto anterior
function produtoAnterior() {
  const produtosDaCategoria = produtosPorCategoria[categoriaAtual];
  
  if (produtosDaCategoria.length === 0) return;
  
  indiceProdutoAtual = (indiceProdutoAtual - 1 + produtosDaCategoria.length) % produtosDaCategoria.length;
  renderizarProdutoAtual();
  atualizarEstadoBotoes();
}

// Mudar categoria
function mudarCategoria(novaCategoria) {
  // Atualizar botões
  elements.categoryLanchesBtn.classList.toggle('active', novaCategoria === 'lanches');
  elements.categoryBebidasBtn.classList.toggle('active', novaCategoria === 'bebidas');
  elements.categoryPorcoesBtn.classList.toggle('active', novaCategoria === 'porcoes');
  
  // Atualizar categoria atual
  categoriaAtual = novaCategoria;
  
  // Resetar índice do produto
  indiceProdutoAtual = 0;
  
  // Atualizar carrossel
  atualizarCarrossel();
}

// Atualizar lanches no carrinho quando adicionais são selecionados
function atualizarLanchesNoCarrinho() {
  const cartItemsSection = document.getElementById('cart-items-section');
  const cartItemsList = document.getElementById('cart-items-list');
  
  // Mostrar seção apenas se houver adicionais selecionados e itens no carrinho
  if (adicionaisSelecionados.length > 0 && carrinho.length > 0) {
    cartItemsSection.style.display = 'block';
    cartItemsList.innerHTML = '';
    
    // Filtrar apenas os lanches (não bebidas nem porções)
    const lanchesNoCarrinho = carrinho.filter(item => 
      produtosPorCategoria.lanches.some(lanche => lanche.id === item.produto.id)
    );
    
    if (lanchesNoCarrinho.length > 0) {
      lanchesNoCarrinho.forEach((item, index) => {
        const cartItemSelector = document.createElement('div');
        cartItemSelector.className = 'cart-item-selector';
        cartItemSelector.innerHTML = `
          <input type="checkbox" id="cart-item-${index}" class="cart-item-checkbox" data-index="${index}">
          <div class="cart-item-info-selector">
            <div class="cart-item-name-selector">${item.produto.nome}</div>
            <div class="cart-item-quantity-selector">${item.quantidade}x</div>
          </div>
        `;
        
        // Adicionar evento de mudança
        const checkbox = cartItemSelector.querySelector('.cart-item-checkbox');
        checkbox.addEventListener('change', (e) => {
          const itemIndex = parseInt(e.target.dataset.index);
          const lancheItem = lanchesNoCarrinho[itemIndex];
          
          // Inicializar o objeto se não existir
          if (!adicionaisParaItensCarrinho[lancheItem.produto.id]) {
            adicionaisParaItensCarrinho[lancheItem.produto.id] = [];
          }
          
          if (e.target.checked) {
            // Adicionar adicionais selecionados a este item
            adicionaisParaItensCarrinho[lancheItem.produto.id] = [...adicionaisSelecionados];
          } else {
            // Remover adicionais deste item
            adicionaisParaItensCarrinho[lancheItem.produto.id] = [];
          }
          
          // Atualizar o carrinho para refletir as mudanças de preço
          atualizarCarrinho();
        });
        
        cartItemsList.appendChild(cartItemSelector);
      });
    } else {
      cartItemsList.innerHTML = '<div class="no-lanches">Nenhum lanche no carrinho</div>';
    }
  } else {
    cartItemsSection.style.display = 'none';
  }
}

// Adicionar produto ao carrinho
function adicionarAoCarrinho(produto, quantidade, observacao, adicionais) {
  // Verificar se há adicionais específicos para este produto
  let adicionaisParaEsteItem = [];
  
  // Se for um lanche, verificar se há adicionais selecionados especificamente para ele
  if (produtosPorCategoria.lanches.some(lanche => lanche.id === produto.id)) {
    // Para novos lanches, usar os adicionais selecionados no modal
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
  
  // Limpar o estado de adicionais para itens do carrinho
  adicionaisParaItensCarrinho = {};
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
      // REMOVIDO: elements.clientPhone.value = clienteInfo.telefone || '';
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
    // REMOVIDO: telefone: elements.clientPhone.value,
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
  
  // Esconder o indicador de swipe após o primeiro uso
  const swipeIndicator = document.querySelector('.swipe-up-indicator');
  if (swipeIndicator) {
    swipeIndicator.style.display = 'none';
  }
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
    // REMOVIDO: telefone: elements.clientPhone.value,
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

// Controles do carrossel
elements.prevProductBtn.addEventListener('click', produtoAnterior);
elements.nextProductBtn.addEventListener('click', proximoProduto);

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
  mudarCategoria('lanches');
});

elements.categoryBebidasBtn.addEventListener('click', () => {
  mudarCategoria('bebidas');
});

elements.categoryPorcoesBtn.addEventListener('click', () => {
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

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', async () => {
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
  
  // Prevenir o comportamento padrão do touchstart no botão de adicionar ao carrinho
  elements.currentProduct.addEventListener('touchstart', (e) => {
    if (e.target.classList.contains('add-to-cart')) {
      e.stopPropagation();
    }
  });
  
  // Adicionar evento touchmove para o botão de adicionar ao carrinho
  elements.currentProduct.addEventListener('touchmove', (e) => {
    if (e.target.classList.contains('add-to-cart')) {
      e.stopPropagation();
      return;
    }
  }, { passive: true });
  
  // Adicionar evento touchcancel para o botão de adicionar ao carrinho
  elements.currentProduct.addEventListener('touchcancel', (e) => {
    if (e.target.classList.contains('add-to-cart')) {
      return;
    }
  });
  
  // Adicionar navegação por botões como alternativa
  elements.prevProductBtn.addEventListener('click', produtoAnterior);
  elements.nextProductBtn.addEventListener('click', proximoProduto);
});

// Adicionar eventos de toque para o carrossel (swipe) - FUNCIONALIDADE TEMPORARIAMENTE DESABILITADA
function adicionarEventosSwipe() {
  const carouselElement = elements.currentProduct;
  const bodyElement = document.body;
  
  console.log('Swipe functionality temporarily disabled for testing');
  
  // Eventos para swipe para cima (abrir carrinho) - MANTIDO
  if (bodyElement) {
    bodyElement.addEventListener('touchstart', handleTouchStartCart, false);
    bodyElement.addEventListener('touchmove', handleTouchMoveCart, false);
    bodyElement.addEventListener('touchend', handleTouchEndCart, false);
    bodyElement.addEventListener('touchcancel', handleTouchEndCart, false);
  }
  
  // Prevenir seleção de texto durante o swipe
  carouselElement.addEventListener('selectstart', (e) => {
    // Permitir seleção de texto em inputs e textareas
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return true;
    }
    e.preventDefault();
  }, false);
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

// Funções para mouse - REMOVIDO TEMPORARIAMENTE
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
  // Verificar se é um evento de toque
  if (e.touches && e.touches.length > 0) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
}

function handleTouchMoveCart(e) {
  if (!touchStartX) return;
  
  // Verificar se é um evento de toque
  if (e.touches && e.touches.length > 0) {
    touchEndX = e.touches[0].clientX;
    touchEndY = e.touches[0].clientY;
  }
}

function handleTouchEndCart(e) {
  // Processar apenas swipe para cima (abrir carrinho)
  if (touchStartY && touchEndY) {
    const diffY = touchStartY - touchEndY;
    const diffX = Math.abs(touchStartX - touchEndX);
    
    // Verificar se é um swipe para cima significativo
    // e se o movimento horizontal não é maior que o vertical
    if (diffY > 50 && diffX < 100) {
      // Abrir o carrinho
      mostrarModal(elements.cartModal);
      
      // Esconder o indicador de swipe após o primeiro uso
      const swipeIndicator = document.querySelector('.swipe-up-indicator');
      if (swipeIndicator) {
        swipeIndicator.style.display = 'none';
      }
    }
  }
  
  // Resetar valores
  touchStartX = 0;
  touchEndX = 0;
  touchStartY = 0;
  touchEndY = 0;
}

// Função para processar o gesto de swipe para cima
function handleSwipeUpGesture() {
  // Abrir o carrinho
  mostrarModal(elements.cartModal);
  
  // Esconder o indicador de swipe após o primeiro uso
  const swipeIndicator = document.querySelector('.swipe-up-indicator');
  if (swipeIndicator) {
    swipeIndicator.style.display = 'none';
  }
}

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
}
