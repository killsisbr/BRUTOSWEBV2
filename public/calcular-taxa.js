// Função utilitária para calcular taxa de entrega com base no endereço digitado

/**
 * Calcular taxa de entrega com base no endereço
 * @param {string} endereco - Endereço completo do cliente
 * @returns {Promise<Object>} Resultado com taxa de entrega e informações
 */
async function calcularTaxaEntrega(endereco) {
  try {
    const response = await fetch('/api/entrega/calcular-taxa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ endereco })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao calcular taxa de entrega:', error);
    return {
      success: false,
      error: 'Erro ao calcular taxa de entrega. Por favor, tente novamente.'
    };
  }
}

/**
 * Formatar valor monetário
 * @param {number} valor - Valor a ser formatado
 * @returns {string} Valor formatado em reais (R$ 0,00)
 */
function formatarValor(valor) {
  return `R$ ${parseFloat(valor).toFixed(2).replace('.', ',')}`;
}

/**
 * Formatar distância
 * @param {number} distancia - Distância em quilômetros
 * @returns {string} Distância formatada (0,00 km)
 */
function formatarDistancia(distancia) {
  return `${parseFloat(distancia).toFixed(2).replace('.', ',')} km`;
}

// Exportar funções
window.CalcularTaxa = {
  calcularTaxaEntrega,
  formatarValor,
  formatarDistancia
};