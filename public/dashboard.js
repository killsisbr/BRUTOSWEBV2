// Variáveis globais para os gráficos
let produtosChart = null;
let clientesChart = null;

// Elementos do DOM
const elements = {
  refreshBtn: document.getElementById('refresh-btn'),
  totalPedidos: document.getElementById('total-pedidos'),
  totalClientes: document.getElementById('total-clientes'),
  ticketMedio: document.getElementById('ticket-medio'),
  valorTotal: document.getElementById('valor-total'),
  totalEntregas: document.getElementById('total-entregas'),
  valorTotalEntregas: document.getElementById('valor-total-entregas'),
  mediaEntregas: document.getElementById('media-entregas'),
  topProdutosContent: document.getElementById('top-produtos-content'),
  topClientesContent: document.getElementById('top-clientes-content')
};

// Função para carregar todas as estatísticas
async function carregarEstatisticas() {
  try {
    // Carregar estatísticas gerais
    await carregarEstatisticasGerais();
    
    // Carregar estatísticas de entrega
    await carregarEstatisticasEntrega();
    
    // Carregar produtos mais vendidos
    await carregarProdutosMaisVendidos();
    
    // Carregar melhores clientes
    await carregarMelhoresClientes();
    
    // Carregar tabelas detalhadas
    await carregarTabelasDetalhadas();
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
    mostrarErro('Erro ao carregar estatísticas. Por favor, tente novamente.');
  }
}

// Carregar estatísticas gerais
async function carregarEstatisticasGerais() {
  try {
    const response = await fetch('/api/estatisticas/gerais');
    const data = await response.json();
    
    elements.totalPedidos.textContent = data.total_pedidos || 0;
    elements.totalClientes.textContent = data.total_clientes || 0;
    elements.ticketMedio.textContent = data.ticket_medio 
      ? `R$ ${parseFloat(data.ticket_medio).toFixed(2).replace('.', ',')}` 
      : 'R$ 0,00';
    elements.valorTotal.textContent = data.valor_total_pedidos 
      ? `R$ ${parseFloat(data.valor_total_pedidos).toFixed(2).replace('.', ',')}` 
      : 'R$ 0,00';
  } catch (error) {
    console.error('Erro ao carregar estatísticas gerais:', error);
  }
}

// Carregar estatísticas de entrega
async function carregarEstatisticasEntrega() {
  try {
    const response = await fetch('/api/estatisticas/valores-entrega');
    const data = await response.json();
    
    elements.totalEntregas.textContent = data.total_entregas || 0;
    elements.valorTotalEntregas.textContent = data.total_valor_entregas 
      ? `R$ ${parseFloat(data.total_valor_entregas).toFixed(2).replace('.', ',')}` 
      : 'R$ 0,00';
    elements.mediaEntregas.textContent = data.media_valor_entregas 
      ? `R$ ${parseFloat(data.media_valor_entregas).toFixed(2).replace('.', ',')}` 
      : 'R$ 0,00';
  } catch (error) {
    console.error('Erro ao carregar estatísticas de entrega:', error);
  }
}

// Carregar produtos mais vendidos e atualizar gráfico
async function carregarProdutosMaisVendidos() {
  try {
    const response = await fetch('/api/estatisticas/produtos-mais-vendidos');
    const produtos = await response.json();
    
    // Atualizar gráfico de produtos
    atualizarGraficoProdutos(produtos);
  } catch (error) {
    console.error('Erro ao carregar produtos mais vendidos:', error);
  }
}

// Atualizar gráfico de produtos
function atualizarGraficoProdutos(produtos) {
  const ctx = document.getElementById('produtos-chart').getContext('2d');
  
  // Destruir gráfico existente se houver
  if (produtosChart) {
    produtosChart.destroy();
  }
  
  // Preparar dados para o gráfico
  const labels = produtos.map(produto => produto.produto_nome);
  const dados = produtos.map(produto => produto.total_vendido);
  
  // Cores para as barras
  const cores = [
    '#27ae60', '#3498db', '#9b59b6', '#f39c12', '#e74c3c',
    '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#f1c40f'
  ];
  
  // Criar novo gráfico
  produtosChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Quantidade Vendida',
        data: dados,
        backgroundColor: cores.slice(0, dados.length),
        borderColor: cores.slice(0, dados.length).map(cor => cor + '80'),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Quantidade: ${context.parsed.y}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#b0b0b0',
            callback: function(value) {
              if (Number.isInteger(value)) {
                return value;
              }
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        x: {
          ticks: {
            color: '#b0b0b0',
            maxRotation: 45,
            minRotation: 45
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Carregar melhores clientes e atualizar gráfico
async function carregarMelhoresClientes() {
  try {
    const response = await fetch('/api/estatisticas/melhores-clientes');
    const clientes = await response.json();
    
    // Atualizar gráfico de clientes
    atualizarGraficoClientes(clientes);
  } catch (error) {
    console.error('Erro ao carregar melhores clientes:', error);
  }
}

// Atualizar gráfico de clientes
function atualizarGraficoClientes(clientes) {
  const ctx = document.getElementById('clientes-chart').getContext('2d');
  
  // Destruir gráfico existente se houver
  if (clientesChart) {
    clientesChart.destroy();
  }
  
  // Preparar dados para o gráfico
  const labels = clientes.map(cliente => cliente.cliente_nome);
  const dados = clientes.map(cliente => cliente.valor_total_gasto);
  
  // Cores para as barras
  const cores = [
    '#3498db', '#27ae60', '#9b59b6', '#f39c12', '#e74c3c',
    '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#f1c40f'
  ];
  
  // Criar novo gráfico
  clientesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Valor Total Gasto (R$)',
        data: dados,
        backgroundColor: cores.slice(0, dados.length),
        borderColor: cores.slice(0, dados.length).map(cor => cor + '80'),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Valor: R$ ${context.parsed.y.toFixed(2).replace('.', ',')}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#b0b0b0',
            callback: function(value) {
              return 'R$ ' + value.toFixed(2).replace('.', ',');
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        x: {
          ticks: {
            color: '#b0b0b0',
            maxRotation: 45,
            minRotation: 45
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Carregar tabelas detalhadas
async function carregarTabelasDetalhadas() {
  try {
    // Carregar tabela de produtos mais vendidos
    await carregarTabelaProdutos();
    
    // Carregar tabela de melhores clientes
    await carregarTabelaClientes();
  } catch (error) {
    console.error('Erro ao carregar tabelas detalhadas:', error);
  }
}

// Carregar tabela de produtos mais vendidos
async function carregarTabelaProdutos() {
  try {
    const response = await fetch('/api/estatisticas/produtos-mais-vendidos');
    const produtos = await response.json();
    
    if (produtos.length === 0) {
      elements.topProdutosContent.innerHTML = '<div class="dashboard-loading">Nenhum produto vendido ainda</div>';
      return;
    }
    
    let tabelaHTML = `
      <table class="dashboard-table">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Quantidade</th>
            <th>Valor Total</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    produtos.forEach((produto, index) => {
      tabelaHTML += `
        <tr>
          <td>${produto.produto_nome}</td>
          <td>${produto.total_vendido}</td>
          <td>R$ ${parseFloat(produto.valor_total).toFixed(2).replace('.', ',')}</td>
        </tr>
      `;
    });
    
    tabelaHTML += `
        </tbody>
      </table>
    `;
    
    elements.topProdutosContent.innerHTML = tabelaHTML;
  } catch (error) {
    console.error('Erro ao carregar tabela de produtos:', error);
    elements.topProdutosContent.innerHTML = '<div class="dashboard-error">Erro ao carregar produtos</div>';
  }
}

// Carregar tabela de melhores clientes
async function carregarTabelaClientes() {
  try {
    const response = await fetch('/api/estatisticas/melhores-clientes');
    const clientes = await response.json();
    
    if (clientes.length === 0) {
      elements.topClientesContent.innerHTML = '<div class="dashboard-loading">Nenhum cliente cadastrado ainda</div>';
      return;
    }
    
    let tabelaHTML = `
      <table class="dashboard-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Pedidos</th>
            <th>Valor Total</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    clientes.forEach((cliente, index) => {
      tabelaHTML += `
        <tr>
          <td>${cliente.cliente_nome}</td>
          <td>${cliente.total_pedidos}</td>
          <td>R$ ${parseFloat(cliente.valor_total_gasto).toFixed(2).replace('.', ',')}</td>
        </tr>
      `;
    });
    
    tabelaHTML += `
        </tbody>
      </table>
    `;
    
    elements.topClientesContent.innerHTML = tabelaHTML;
  } catch (error) {
    console.error('Erro ao carregar tabela de clientes:', error);
    elements.topClientesContent.innerHTML = '<div class="dashboard-error">Erro ao carregar clientes</div>';
  }
}

// Mostrar mensagem de erro
function mostrarErro(mensagem) {
  // Aqui você pode implementar uma notificação de erro mais elaborada
  console.error(mensagem);
  alert(mensagem);
}

// Event Listeners
elements.refreshBtn.addEventListener('click', carregarEstatisticas);

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', () => {
  carregarEstatisticas();
  
  // Atualizar automaticamente a cada 60 segundos
  setInterval(carregarEstatisticas, 60000);
});