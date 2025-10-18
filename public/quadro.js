// Estado da aplicação
let pedidos = [];
let pedidoSelecionado = null;

// Elementos do DOM
const elements = {
  refreshBtn: document.getElementById('refresh-btn'),
  pendingOrders: document.getElementById('pending-orders'),
  preparingOrders: document.getElementById('preparing-orders'),
  readyOrders: document.getElementById('ready-orders'),
  deliveredOrders: document.getElementById('delivered-orders'),
  archivedOrders: document.getElementById('archived-orders'),
  pendingCount: document.getElementById('pending-count'),
  preparingCount: document.getElementById('preparing-count'),
  readyCount: document.getElementById('ready-count'),
  deliveredCount: document.getElementById('delivered-count'),
  archivedCount: document.getElementById('archived-count'),
  orderDetailsModal: document.getElementById('order-details-modal'),
  orderIdDisplay: document.getElementById('order-id-display'),
  orderStatusBadge: document.getElementById('order-status-badge'),
  customerName: document.getElementById('customer-name'),
  customerPhone: document.getElementById('customer-phone'),
  customerAddress: document.getElementById('customer-address'),
  paymentMethod: document.getElementById('payment-method'),
  orderItemsList: document.getElementById('order-items-list'),
  orderTotalAmount: document.getElementById('order-total-amount'),
  archiveOrderBtn: document.getElementById('archive-order-btn'),
  deleteOrderBtn: document.getElementById('delete-order-btn'),
  prevStatusBtn: document.getElementById('prev-status-btn'),
  nextStatusBtn: document.getElementById('next-status-btn'),
  closeButtons: document.querySelectorAll('.close-button'),
  filterButtons: document.querySelectorAll('.filter-btn')
};

// Mapeamento de status para texto e cor
const statusConfig = {
  pending: { text: 'Pendente', color: '#f39c12', icon: 'fa-clock' },
  preparing: { text: 'Em Preparação', color: '#3498db', icon: 'fa-utensils' },
  ready: { text: 'Pronto', color: '#27ae60', icon: 'fa-check-circle' },
  delivered: { text: 'Entregue', color: '#9b59b6', icon: 'fa-truck' },
  archived: { text: 'Arquivado', color: '#95a5a6', icon: 'fa-archive' }
};

// Ordem dos status
const statusOrder = ['pending', 'preparing', 'ready', 'delivered', 'archived'];

// Função para carregar pedidos
async function carregarPedidos() {
  try {
    const res = await fetch('/api/pedidos');
    pedidos = await res.json();
    renderizarQuadro();
  } catch (error) {
    console.error('Erro ao carregar pedidos:', error);
  }
}

// Renderizar quadro de pedidos
function renderizarQuadro() {
  // Limpar containers
  elements.pendingOrders.innerHTML = '';
  elements.preparingOrders.innerHTML = '';
  elements.readyOrders.innerHTML = '';
  elements.deliveredOrders.innerHTML = '';
  elements.archivedOrders.innerHTML = '';
  
  // Contadores
  const counts = {
    pending: 0,
    preparing: 0,
    ready: 0,
    delivered: 0,
    archived: 0
  };
  
  // Agrupar pedidos por status
  pedidos.forEach(pedido => {
    counts[pedido.status]++;
    
    const orderCard = criarCardPedido(pedido);
    
    switch (pedido.status) {
      case 'pending':
        elements.pendingOrders.appendChild(orderCard);
        break;
      case 'preparing':
        elements.preparingOrders.appendChild(orderCard);
        break;
      case 'ready':
        elements.readyOrders.appendChild(orderCard);
        break;
      case 'delivered':
        elements.deliveredOrders.appendChild(orderCard);
        break;
      case 'archived':
        elements.archivedOrders.appendChild(orderCard);
        break;
    }
  });
  
  // Atualizar contadores
  elements.pendingCount.textContent = counts.pending;
  elements.preparingCount.textContent = counts.preparing;
  elements.readyCount.textContent = counts.ready;
  elements.deliveredCount.textContent = counts.delivered;
  elements.archivedCount.textContent = counts.archived;
}

// Criar card de pedido
function criarCardPedido(pedido) {
  const card = document.createElement('div');
  card.className = 'order-card';
  card.dataset.id = pedido.id;
  
  // Formatar data
  const data = new Date(pedido.data);
  const dataFormatada = data.toLocaleDateString('pt-BR');
  const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  // Calcular total de itens
  const totalItens = pedido.itens.reduce((total, item) => total + item.quantidade, 0);
  
  card.innerHTML = `
    <div class="order-card-header">
      <h3>Pedido #${pedido.id}</h3>
      <span class="order-time">${horaFormatada}</span>
    </div>
    <div class="order-card-body">
      <p class="customer-name">${pedido.cliente_nome}</p>
      <p class="order-items-count">${totalItens} item(s)</p>
      <p class="order-total">R$ ${pedido.total.toFixed(2).replace('.', ',')}</p>
    </div>
    <div class="order-card-footer">
      <span class="order-status-badge small" style="background-color: ${statusConfig[pedido.status].color}">
        <i class="fas ${statusConfig[pedido.status].icon}"></i>
        ${statusConfig[pedido.status].text}
      </span>
    </div>
  `;
  
  // Adicionar evento de clique
  card.addEventListener('click', () => mostrarDetalhesPedido(pedido));
  
  return card;
}

// Mostrar detalhes do pedido
function mostrarDetalhesPedido(pedido) {
  pedidoSelecionado = pedido;
  
  // Atualizar informações do pedido
  elements.orderIdDisplay.textContent = `Pedido #${pedido.id}`;
  
  // Atualizar badge de status
  const statusInfo = statusConfig[pedido.status];
  elements.orderStatusBadge.innerHTML = `
    <i class="fas ${statusInfo.icon}"></i>
    ${statusInfo.text}
  `;
  elements.orderStatusBadge.style.backgroundColor = statusInfo.color;
  
  // Atualizar informações do cliente
  elements.customerName.textContent = pedido.cliente_nome || 'Não informado';
  elements.customerPhone.textContent = pedido.cliente_telefone || 'Não informado';
  elements.customerAddress.textContent = pedido.cliente_endereco || 'Não informado';
  elements.paymentMethod.textContent = pedido.forma_pagamento || 'Não informado';
  
  // Atualizar itens do pedido
  elements.orderItemsList.innerHTML = '';
  pedido.itens.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'order-item';
    itemElement.innerHTML = `
      <div class="item-details">
        <span class="item-name">${item.produto_nome || item.produto.nome}</span>
        <span class="item-quantity">x${item.quantidade}</span>
      </div>
      <div class="item-price">R$ ${(item.preco_unitario * item.quantidade).toFixed(2).replace('.', ',')}</div>
    `;
    elements.orderItemsList.appendChild(itemElement);
  });
  
  // Atualizar total
  elements.orderTotalAmount.textContent = `R$ ${pedido.total.toFixed(2).replace('.', ',')}`;
  
  // Atualizar botões de status
  atualizarBotoesStatus(pedido.status);
  
  // Mostrar modal
  mostrarModal(elements.orderDetailsModal);
}

// Atualizar botões de status
function atualizarBotoesStatus(status) {
  const currentIndex = statusOrder.indexOf(status);
  
  // Desabilitar botão de voltar se for o primeiro status
  elements.prevStatusBtn.disabled = currentIndex === 0;
  
  // Desabilitar botão de avançar se for o último status
  elements.nextStatusBtn.disabled = currentIndex === statusOrder.length - 1;
  
  // Esconder botão de arquivar se já estiver arquivado
  elements.archiveOrderBtn.style.display = status === 'archived' ? 'none' : 'inline-block';
}

// Avançar status do pedido
async function avancarStatus() {
  if (!pedidoSelecionado) return;
  
  const currentIndex = statusOrder.indexOf(pedidoSelecionado.status);
  if (currentIndex < statusOrder.length - 1) {
    const novoStatus = statusOrder[currentIndex + 1];
    await atualizarStatusPedido(pedidoSelecionado.id, novoStatus);
  }
}

// Voltar status do pedido
async function voltarStatus() {
  if (!pedidoSelecionado) return;
  
  const currentIndex = statusOrder.indexOf(pedidoSelecionado.status);
  if (currentIndex > 0) {
    const novoStatus = statusOrder[currentIndex - 1];
    await atualizarStatusPedido(pedidoSelecionado.id, novoStatus);
  }
}

// Arquivar pedido
async function arquivarPedido() {
  if (!pedidoSelecionado) return;
  
  await atualizarStatusPedido(pedidoSelecionado.id, 'archived');
}

// Remover pedido
async function removerPedido() {
  if (!pedidoSelecionado) return;
  
  if (confirm(`Tem certeza que deseja remover o pedido #${pedidoSelecionado.id}? Esta ação não pode ser desfeita.`)) {
    try {
      const response = await fetch(`/api/pedidos/${pedidoSelecionado.id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Fechar modal
        fecharModal(elements.orderDetailsModal);
        
        // Recarregar pedidos
        carregarPedidos();
        
        alert('Pedido removido com sucesso!');
      } else {
        alert('Erro ao remover pedido: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao remover pedido:', error);
      alert('Erro ao remover pedido. Por favor, tente novamente.');
    }
  }
}

// Atualizar status do pedido
async function atualizarStatusPedido(pedidoId, novoStatus) {
  try {
    const response = await fetch(`/api/pedidos/${pedidoId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: novoStatus })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Fechar modal
      fecharModal(elements.orderDetailsModal);
      
      // Recarregar pedidos
      carregarPedidos();
      
      // Se estiver arquivando, mostrar mensagem
      if (novoStatus === 'archived') {
        alert('Pedido arquivado com sucesso!');
      }
    } else {
      alert('Erro ao atualizar status do pedido: ' + result.error);
    }
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    alert('Erro ao atualizar status do pedido. Por favor, tente novamente.');
  }
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
elements.refreshBtn.addEventListener('click', carregarPedidos);
elements.archiveOrderBtn.addEventListener('click', arquivarPedido);
elements.deleteOrderBtn.addEventListener('click', removerPedido);
elements.prevStatusBtn.addEventListener('click', voltarStatus);
elements.nextStatusBtn.addEventListener('click', avancarStatus);

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

// Filtros
elements.filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Remover classe active de todos os botões
    elements.filterButtons.forEach(btn => btn.classList.remove('active'));
    
    // Adicionar classe active ao botão clicado
    button.classList.add('active');
    
    // Aqui você pode implementar a lógica de filtragem
    // Por enquanto, vamos apenas recarregar todos os pedidos
    carregarPedidos();
  });
});

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', () => {
  carregarPedidos();
  
  // Atualizar pedidos a cada 30 segundos
  setInterval(carregarPedidos, 30000);
});