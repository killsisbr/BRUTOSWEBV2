// Estado da aplicação
let pedidos = [];
let pedidoSelecionado = null;
let autoRefreshInterval = null;
let autoPrintEnabled = false;

// Elementos do DOM
const elements = {
  refreshBtn: document.getElementById('refresh-btn'),
  autoRefreshCheckbox: document.getElementById('auto-refresh-checkbox'),
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
  closeButtons: document.querySelectorAll('.pc-close-button'),
  filterButtons: document.querySelectorAll('.pc-filter-btn'),
  // Contadores de filtros
  allCount: document.getElementById('all-count'),
  pendingCount: document.getElementById('pending-count'),
  preparingCount: document.getElementById('preparing-count'),
  readyCount: document.getElementById('ready-count'),
  deliveredCount: document.getElementById('delivered-count'),
  archivedCount: document.getElementById('archived-count'),
  // Containers de pedidos
  pendingOrdersContainer: document.getElementById('pending-orders-container'),
  preparingOrdersContainer: document.getElementById('preparing-orders-container'),
  readyOrdersContainer: document.getElementById('ready-orders-container'),
  deliveredOrdersContainer: document.getElementById('delivered-orders-container'),
  archivedOrdersContainer: document.getElementById('archived-orders-container'),
  // Contadores de colunas
  pendingColumnCount: document.getElementById('pending-column-count'),
  preparingColumnCount: document.getElementById('preparing-column-count'),
  readyColumnCount: document.getElementById('ready-column-count'),
  deliveredColumnCount: document.getElementById('delivered-column-count'),
  archivedColumnCount: document.getElementById('archived-column-count'),
  // Elemento da coluna de preparação
  preparingColumn: document.getElementById('preparing-column'),
  // Resumo
  totalOrders: document.getElementById('total-orders'),
  totalValue: document.getElementById('total-value'),
  pendingOrdersSummary: document.getElementById('pending-orders'),
  preparingOrdersSummary: document.getElementById('preparing-orders'),
  // Botão de teste de impressão
  printTestBtn: document.getElementById('print-test-btn'),
  // Botão de impressão de pedido
  printOrderBtn: document.getElementById('print-order-btn')
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
    const novosPedidos = await res.json();
    
    // Detectar novos pedidos
    const pedidosAtuais = new Set(pedidos.map(p => p.id));
    const novosPedidosIds = novosPedidos.filter(p => !pedidosAtuais.has(p.id)).map(p => p.id);
    
    pedidos = novosPedidos;
    renderizarQuadro();
    atualizarResumo();
    
    // Imprimir novos pedidos se a opção estiver habilitada
    if (novosPedidosIds.length > 0) {
      const autoPrint = localStorage.getItem('autoPrintEnabled') === 'true';
      if (autoPrint) {
        // Encontrar os pedidos novos
        const pedidosNovos = pedidos.filter(p => novosPedidosIds.includes(p.id));
        pedidosNovos.forEach(pedido => {
          // Apenas imprimir pedidos pendentes (novos)
          if (pedido.status === 'pending') {
            setTimeout(() => {
              imprimirPedido(pedido);
            }, 1000); // Pequeno atraso para garantir que o pedido foi salvo
          }
        });
      }
    }
  } catch (error) {
    console.error('Erro ao carregar pedidos:', error);
  }
}

// Renderizar quadro de pedidos
function renderizarQuadro() {
  // Salvar IDs dos pedidos atuais para detectar novos pedidos
  const pedidosAtuais = new Set(pedidos.map(p => p.id));
  
  // Limpar containers
  elements.pendingOrdersContainer.innerHTML = '';
  elements.preparingOrdersContainer.innerHTML = '';
  elements.readyOrdersContainer.innerHTML = '';
  elements.deliveredOrdersContainer.innerHTML = '';
  elements.archivedOrdersContainer.innerHTML = '';
  
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
        elements.pendingOrdersContainer.appendChild(orderCard);
        break;
      case 'preparing':
        elements.preparingOrdersContainer.appendChild(orderCard);
        break;
      case 'ready':
        elements.readyOrdersContainer.appendChild(orderCard);
        break;
      case 'delivered':
        elements.deliveredOrdersContainer.appendChild(orderCard);
        break;
      case 'archived':
        elements.archivedOrdersContainer.appendChild(orderCard);
        break;
    }
  });
  
  // Mostrar ou esconder a coluna de "em preparo" conforme necessário
  if (counts.preparing > 0) {
    elements.preparingColumn.style.display = 'flex';
  } else {
    elements.preparingColumn.style.display = 'none';
  }
  
  // Atualizar contadores de colunas
  elements.pendingColumnCount.textContent = counts.pending;
  elements.preparingColumnCount.textContent = counts.preparing;
  elements.readyColumnCount.textContent = counts.ready;
  elements.deliveredColumnCount.textContent = counts.delivered;
  elements.archivedColumnCount.textContent = counts.archived;
  
  // Atualizar contadores de filtros
  elements.allCount.textContent = pedidos.length;
  elements.pendingCount.textContent = counts.pending;
  elements.preparingCount.textContent = counts.preparing;
  elements.readyCount.textContent = counts.ready;
  elements.deliveredCount.textContent = counts.delivered;
  elements.archivedCount.textContent = counts.archived;
}

// Criar card de pedido
function criarCardPedido(pedido) {
  try {
    const card = document.createElement('div');
    card.className = 'pc-order-card';
    card.dataset.id = pedido.id;
    
    // Verificar se o pedido tem os dados necessários
    if (!pedido) {
      console.error('Pedido inválido para criação de card:', pedido);
      return card;
    }
    
    // Formatar data
    let dataFormatada = 'Data não disponível';
    let horaFormatada = 'Hora não disponível';
    
    try {
      const data = new Date(pedido.data);
      if (!isNaN(data.getTime())) {
        dataFormatada = data.toLocaleDateString('pt-BR');
        horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }
    } catch (dateError) {
      console.error('Erro ao formatar data do pedido:', dateError, pedido.data);
    }
    
    // Calcular total de itens
    let totalItens = 0;
    try {
      if (pedido.itens && Array.isArray(pedido.itens)) {
        totalItens = pedido.itens.reduce((total, item) => total + (item.quantidade || 0), 0);
      }
    } catch (itemsError) {
      console.error('Erro ao calcular total de itens:', itemsError, pedido.itens);
    }
    
    // Obter valor total do pedido
    const totalPedido = pedido.total || 0;
    
    // Verificar se o status existe no mapeamento
    const statusInfo = statusConfig[pedido.status] || { 
      text: pedido.status || 'Desconhecido', 
      color: '#95a5a6', 
      icon: 'fa-question-circle' 
    };
    
    card.innerHTML = `
      <div class="pc-order-header">
        <div class="pc-order-id">Pedido #${pedido.id || 'N/A'}</div>
        <div class="pc-order-time">${horaFormatada}</div>
      </div>
      <div class="pc-order-details">
        <div class="pc-customer-name">${pedido.cliente_nome || 'Cliente não informado'}</div>
        <div class="pc-order-items">${totalItens} item(s)</div>
        <div class="pc-order-total">R$ ${totalPedido.toFixed(2).replace('.', ',')}</div>
      </div>
      <div class="pc-order-footer">
        <span class="pc-order-status" style="background-color: ${statusInfo.color}">
          <i class="fas ${statusInfo.icon}"></i>
          ${statusInfo.text}
        </span>
      </div>
    `;
    
    // Adicionar evento de clique
    card.addEventListener('click', () => mostrarDetalhesPedido(pedido));
    
    return card;
  } catch (error) {
    console.error('Erro ao criar card de pedido:', error, pedido);
    // Criar um card de erro
    const errorCard = document.createElement('div');
    errorCard.className = 'pc-order-card';
    errorCard.innerHTML = `
      <div class="pc-order-header">
        <div class="pc-order-id">Erro no Pedido</div>
      </div>
      <div class="pc-order-details">
        <div class="pc-customer-name">Erro ao carregar pedido</div>
        <div class="pc-order-items">ID: ${pedido ? pedido.id : 'Desconhecido'}</div>
      </div>
    `;
    return errorCard;
  }
}

// Mostrar detalhes do pedido
function mostrarDetalhesPedido(pedido) {
  try {
    pedidoSelecionado = pedido;
    
    // Verificar se o pedido tem todos os dados necessários
    if (!pedido) {
      console.error('Pedido inválido:', pedido);
      alert('Erro: Pedido inválido. Por favor, atualize a página e tente novamente.');
      return;
    }
    
    // Atualizar informações do pedido
    elements.orderIdDisplay.textContent = `Pedido #${pedido.id}`;
    
    // Verificar se o status existe no mapeamento
    const statusInfo = statusConfig[pedido.status] || { 
      text: pedido.status || 'Desconhecido', 
      color: '#95a5a6', 
      icon: 'fa-question-circle' 
    };
    
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
    
    // Verificar se há itens no pedido
    if (!pedido.itens || !Array.isArray(pedido.itens)) {
      console.error('Itens do pedido inválidos:', pedido);
      elements.orderItemsList.innerHTML = '<div class="pc-item-row">Nenhum item encontrado</div>';
    } else {
      // Atualizar itens do pedido
      elements.orderItemsList.innerHTML = '';
      pedido.itens.forEach(item => {
        try {
          const itemElement = document.createElement('div');
          itemElement.className = 'pc-item-row';
          
          // Verificar se o item tem as propriedades necessárias
          const produtoNome = item.produto_nome || (item.produto && item.produto.nome) || 'Produto não identificado';
          const quantidade = item.quantidade || 0;
          const precoUnitario = item.preco_unitario || (item.produto && item.produto.preco) || 0;
          const precoTotal = (precoUnitario * quantidade).toFixed(2).replace('.', ',');
          
          itemElement.innerHTML = `
            <div class="pc-item-details">
              <div class="pc-item-name">${produtoNome}</div>
              <div class="pc-item-quantity">Quantidade: ${quantidade}</div>
            </div>
            <div class="pc-item-price">R$ ${precoTotal}</div>
          `;
          elements.orderItemsList.appendChild(itemElement);
        } catch (itemError) {
          console.error('Erro ao processar item do pedido:', itemError, item);
        }
      });
    }
    
    // Atualizar total
    const total = pedido.total || 0;
    elements.orderTotalAmount.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    
    // Atualizar botões de status
    atualizarBotoesStatus(pedido.status);
    
    // Mostrar modal
    mostrarModal(elements.orderDetailsModal);
  } catch (error) {
    console.error('Erro ao mostrar detalhes do pedido:', error, pedido);
    alert('Erro ao carregar detalhes do pedido. Por favor, atualize a página e tente novamente.');
  }
}

// Atualizar botões de status
function atualizarBotoesStatus(status) {
  const currentIndex = statusOrder.indexOf(status);
  
  // Desabilitar botão de voltar se for o primeiro status
  elements.prevStatusBtn.disabled = currentIndex === 0;
  
  // Desabilitar botão de avançar se for o último status
  elements.nextStatusBtn.disabled = currentIndex === statusOrder.length - 1;
  
  // Esconder botão de arquivar se já estiver arquivado
  elements.archiveOrderBtn.style.display = status === 'archived' ? 'none' : 'flex';
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

// Atualizar resumo
function atualizarResumo() {
  // Total de pedidos
  elements.totalOrders.textContent = pedidos.length;
  
  // Valor total
  const valorTotal = pedidos.reduce((total, pedido) => total + pedido.total, 0);
  elements.totalValue.textContent = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
  
  // Contagem por status
  const statusCounts = {
    pending: 0,
    preparing: 0
  };
  
  pedidos.forEach(pedido => {
    if (pedido.status === 'pending') statusCounts.pending++;
    if (pedido.status === 'preparing') statusCounts.preparing++;
  });
  
  elements.pendingOrdersSummary.textContent = statusCounts.pending;
  elements.preparingOrdersSummary.textContent = statusCounts.preparing;
}

// Função para imprimir pedido - versão atualizada para impressoras térmicas
function imprimirPedido(pedido) {
  try {
    // Criar conteúdo da impressão otimizado para impressora térmica 80mm
    let conteudoImpressao = formatarPedidoParaImpressoraTermica(pedido);
    
    // Mostrar preview da impressão em um modal otimizado para térmica
    mostrarPreviewImpressaoTermica(conteudoImpressao, pedido.id);
    
    console.log(`Preview de impressão do pedido #${pedido.id} exibido`);
  } catch (error) {
    console.error('Erro ao preparar impressão do pedido:', error);
  }
}

// Função para formatar o pedido especificamente para impressoras térmicas 80mm
function formatarPedidoParaImpressoraTermica(pedido) {
  // Definir largura máxima para impressora térmica (80mm = ~48 caracteres)
  const larguraLinha = 48;
  
  // Função auxiliar para centralizar texto
  function centralizarTexto(texto, largura) {
    if (texto.length >= largura) return texto.substring(0, largura);
    const espacos = Math.floor((largura - texto.length) / 2);
    return ' '.repeat(espacos) + texto;
  }
  
  // Função auxiliar para criar linha divisória
  function linhaDivisoria(caractere = '-') {
    return caractere.repeat(larguraLinha);
  }
  
  // Função auxiliar para formatar valores monetários
  function formatarMoeda(valor) {
    return `R$ ${parseFloat(valor).toFixed(2).replace('.', ',')}`;
  }
  
  // Função auxiliar para truncar texto
  function truncarTexto(texto, comprimento) {
    return texto.length > comprimento ? texto.substring(0, comprimento - 3) + '...' : texto;
  }
  
  // Construir conteúdo da impressão
  let linhas = [];
  
  // Cabeçalho
  linhas.push(centralizarTexto('PEDIDO #' + pedido.id, larguraLinha));
  linhas.push(linhaDivisoria('='));
  
  // Data e hora
  const data = new Date(pedido.data);
  linhas.push(`DATA: ${data.toLocaleDateString('pt-BR')}`);
  linhas.push(`HORA: ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
  linhas.push('');
  
  // Informações do cliente
  linhas.push('CLIENTE:');
  linhas.push(truncarTexto(pedido.cliente_nome || 'NÃO INFORMADO', larguraLinha));
  if (pedido.cliente_telefone) {
    linhas.push(`TEL: ${pedido.cliente_telefone}`);
  }
  if (pedido.cliente_endereco) {
    linhas.push(truncarTexto(pedido.cliente_endereco, larguraLinha));
  }
  linhas.push(`PAGAMENTO: ${pedido.forma_pagamento || 'NÃO INFORMADO'}`);
  linhas.push('');
  
  // Itens do pedido
  linhas.push('ITENS:');
  linhas.push(linhaDivisoria());
  
  pedido.itens.forEach(item => {
    const nomeProduto = truncarTexto(item.produto_nome || item.produto?.nome || 'PRODUTO SEM NOME', 30);
    const quantidade = item.quantidade || 0;
    const precoUnitario = formatarMoeda(item.preco_unitario || item.produto?.preco || 0);
    const precoTotal = formatarMoeda((item.preco_unitario || item.produto?.preco || 0) * quantidade);
    
    // Linha do item
    linhas.push(`${quantidade}x ${nomeProduto}`);
    linhas.push(`    ${precoUnitario} x ${quantidade} = ${precoTotal}`);
    linhas.push('');
  });
  
  // Total
  linhas.push(linhaDivisoria('='));
  linhas.push(centralizarTexto(`TOTAL: ${formatarMoeda(pedido.total)}`, larguraLinha));
  linhas.push(linhaDivisoria('='));
  linhas.push('');
  
  // Rodapé
  const agora = new Date();
  linhas.push(centralizarTexto('OBRIGADO PELA PREFERÊNCIA!', larguraLinha));
  linhas.push(centralizarTexto(`${agora.getFullYear()}`, larguraLinha));
  linhas.push('');
  linhas.push(linhaDivisoria('*'));
  
  return linhas.join('\n');
}

// Função para mostrar preview da impressão otimizado para impressoras térmicas
function mostrarPreviewImpressaoTermica(conteudo, pedidoId) {
  // Criar elementos do modal de preview
  const modal = document.createElement('div');
  modal.className = 'pc-modal show';
  modal.id = 'print-preview-modal';
  modal.style.display = 'block';
  
  modal.innerHTML = `
    <div class="pc-modal-content" style="max-width: 500px;">
      <div class="pc-modal-header">
        <h2><i class="fas fa-print"></i> Preview Impressão Térmica - Pedido #${pedidoId}</h2>
        <button class="pc-close-button" id="close-print-preview">&times;</button>
      </div>
      <div class="pc-modal-body" style="padding: 0;">
        <div class="thermal-print-preview">
          <div class="thermal-print-header">
            <h3>Simulação de Cupom Térmico 80mm</h3>
            <p>Esta é uma prévia de como o pedido será impresso em uma impressora térmica de 80mm</p>
          </div>
          <div class="thermal-print-content">
            <pre style="background: white; color: black; padding: 20px; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.3; white-space: pre; margin: 0; border: 1px dashed #ccc;">${conteudo}</pre>
          </div>
          <div class="thermal-print-footer">
            <div class="thermal-print-instructions">
              <p><i class="fas fa-info-circle"></i> O cupom será impresso em papel térmico de 80mm com largura de impressão útil de 72mm</p>
            </div>
            <div class="thermal-print-actions">
              <button class="pc-action-btn pc-delete-btn" id="cancel-print">
                <i class="fas fa-times"></i> Cancelar
              </button>
              <button class="pc-action-btn pc-print-btn" id="confirm-print">
                <i class="fas fa-print"></i> Imprimir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Adicionar estilos específicos para o preview térmico
  const style = document.createElement('style');
  style.textContent = `
    .thermal-print-preview {
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .thermal-print-header {
      background: #f8f9fa;
      padding: 15px 20px;
      border-bottom: 1px solid #ddd;
    }
    
    .thermal-print-header h3 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 18px;
    }
    
    .thermal-print-header p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
    
    .thermal-print-content {
      max-height: 500px;
      overflow-y: auto;
    }
    
    .thermal-print-footer {
      background: #f8f9fa;
      padding: 15px 20px;
      border-top: 1px solid #ddd;
    }
    
    .thermal-print-instructions {
      margin-bottom: 15px;
      padding: 10px;
      background: #e9f7fe;
      border-radius: 4px;
      font-size: 13px;
    }
    
    .thermal-print-instructions i {
      color: #007bff;
    }
    
    .thermal-print-actions {
      display: flex;
      justify-content: space-between;
    }
    
    @media print {
      .thermal-print-content pre {
        font-size: 12px;
        line-height: 1.2;
      }
    }
  `;
  document.head.appendChild(style);
  
  // Adicionar modal ao body
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Adicionar eventos aos botões
  document.getElementById('close-print-preview').addEventListener('click', () => {
    document.body.removeChild(modal);
    document.body.style.overflow = 'auto';
    if (style.parentNode) {
      style.parentNode.removeChild(style);
    }
  });
  
  document.getElementById('cancel-print').addEventListener('click', () => {
    document.body.removeChild(modal);
    document.body.style.overflow = 'auto';
    if (style.parentNode) {
      style.parentNode.removeChild(style);
    }
  });
  
  document.getElementById('confirm-print').addEventListener('click', () => {
    // Remover modal
    document.body.removeChild(modal);
    document.body.style.overflow = 'auto';
    if (style.parentNode) {
      style.parentNode.removeChild(style);
    }
    
    // Imprimir o conteúdo
    imprimirConteudoTermico(conteudo);
  });
}

// Função para imprimir o conteúdo otimizado para impressoras térmicas
function imprimirConteudoTermico(conteudo) {
  try {
    // Criar uma janela de impressão otimizada para térmica
    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(`
      <html>
        <head>
          <title>Impressão Térmica - Pedido</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.3;
              margin: 0;
              padding: 0;
              width: 80mm; /* Largura padrão para impressora térmica 80mm */
            }
            pre {
              margin: 0;
              padding: 10px;
              white-space: pre;
              word-wrap: break-word;
            }
            @media print {
              body {
                width: 80mm;
                margin: 0;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <pre>${conteudo}</pre>
        </body>
      </html>
    `);
    janelaImpressao.document.close();
    janelaImpressao.focus();
    
    // Aguardar um momento e imprimir
    setTimeout(() => {
      janelaImpressao.print();
      // Não fechamos automaticamente para permitir ao usuário verificar a impressão
      // janelaImpressao.close();
    }, 500);
  } catch (error) {
    console.error('Erro ao imprimir conteúdo térmico:', error);
    alert('Erro ao imprimir. Verifique se a impressora está configurada corretamente.');
  }
}

// Função para teste de impressão
function testarImpressao() {
  // Criar um pedido de teste
  const pedidoTeste = {
    id: 999,
    data: new Date().toISOString(),
    cliente_nome: 'Cliente de Teste',
    cliente_telefone: '(00) 00000-0000',
    cliente_endereco: 'Rua de Teste, 123',
    forma_pagamento: 'Dinheiro',
    total: 45.50,
    itens: [
      {
        produto_nome: 'Hambúrguer Especial',
        preco_unitario: 25.00,
        quantidade: 1
      },
      {
        produto_nome: 'Batata Frita',
        preco_unitario: 12.00,
        quantidade: 2
      },
      {
        produto_nome: 'Refrigerante',
        preco_unitario: 8.50,
        quantidade: 1
      }
    ]
  };
  
  imprimirPedido(pedidoTeste);
}

// Função para imprimir o pedido selecionado
function imprimirPedidoSelecionado() {
  if (pedidoSelecionado) {
    imprimirPedido(pedidoSelecionado);
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

// Função para iniciar a atualização automática
function iniciarAtualizacaoAutomatica() {
  // Verificar se o checkbox está marcado
  const autoRefreshEnabled = elements.autoRefreshCheckbox.checked;
  
  // Limpar intervalo existente
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
  
  // Iniciar novo intervalo se a opção estiver habilitada
  if (autoRefreshEnabled) {
    autoRefreshInterval = setInterval(carregarPedidos, 5000); // Atualizar a cada 5 segundos
  }
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  // Carregar pedidos iniciais
  carregarPedidos();
  
  // Adicionar evento de clique ao botão de refresh
  elements.refreshBtn.addEventListener('click', carregarPedidos);
  
  // Adicionar evento de clique ao botão de teste de impressão
  elements.printTestBtn.addEventListener('click', testarImpressao);
  
  // Adicionar evento de clique ao botão de impressão de pedido
  elements.printOrderBtn.addEventListener('click', imprimirPedidoSelecionado);
  
  // Adicionar evento de clique aos botões de fechar modal
  elements.closeButtons.forEach(button => {
    button.addEventListener('click', () => fecharModal(elements.orderDetailsModal));
  });
  
  // Adicionar evento de clique ao botão de arquivar pedido
  elements.archiveOrderBtn.addEventListener('click', arquivarPedido);
  
  // Adicionar evento de clique ao botão de remover pedido
  elements.deleteOrderBtn.addEventListener('click', removerPedido);
  
  // Adicionar evento de clique ao botão de avançar status
  elements.nextStatusBtn.addEventListener('click', avancarStatus);
  
  // Adicionar evento de clique ao botão de voltar status
  elements.prevStatusBtn.addEventListener('click', voltarStatus);
  
  // Adicionar evento de mudança ao checkbox de atualização automática
  elements.autoRefreshCheckbox.addEventListener('change', iniciarAtualizacaoAutomatica);
  
  // Iniciar atualização automática se estiver habilitada
  iniciarAtualizacaoAutomatica();
});
