// Estado da aplicação
let produtos = [];
let carrinho = [];
let produtosPorCategoria = {
  lanches: [],
  bebidas: [],
  porcoes: [],
  adicionais: [] // Adicionando novamente a categoria de adicionais
};
let categoriaAtual = 'lanches';
let indiceProdutoAtual = 0;
let produtoSelecionado = null;
let quantidadeSelecionada = 1;
let observacaoAtual = '';
let adicionaisSelecionados = [];
// Novo estado para controlar em quais itens do carrinho aplicar os adicionais
let adicionaisParaItensCarrinho = {};
// Novo estado para controlar adicionais para novos itens
let adicionaisParaNovoItem = [];

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
  categoryPorcoesBtn: document.getElementById('category-porcoes')
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

// Função para gerar SVG placeholder inline
function getPlaceholderSVG(width, height, text = '') {
  // Codificar o texto para uso em SVG
  const encodedText = encodeURIComponent(text);
  
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='100%25' height='100%25' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='${Math.min(width, height) / 8}' fill='%23666'%3E${encodedText}%3C/text%3E%3C/svg%3E`;
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
  document.body.style.overflow = 'hidden';
}

// Fechar modal
function fecharModal(modal) {
  modal.classList.remove('show');
  document.body.style.overflow = 'auto';
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
});

elements.confirmOrderBtn.addEventListener('click', () => {
  if (carrinho.length === 0) return;
  
  // Fechar modal de checkout e mostrar confirmação
  fecharModal(elements.checkoutModal);
  mostrarModal(elements.confirmationModal);
  
  // Limpar carrinho
  carrinho = [];
  atualizarCarrinho();
});

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
document.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();
  
  // Delegação de eventos para o botão "Adicionar ao Carrinho"
  // Agora que o DOM está carregado, podemos adicionar o event listener
  elements.currentProduct.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-to-cart')) {
      const produtoId = parseInt(e.target.dataset.id);
      // Procurar o produto em todas as categorias
      produtoSelecionado = produtos.find(p => p.id === produtoId);
      if (produtoSelecionado) {
        mostrarModalQuantidade(produtoSelecionado);
      }
    }
  });
  
  // Prevenir scroll na página
  document.body.style.overflow = 'hidden';
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
}
