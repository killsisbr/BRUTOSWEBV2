// Elementos do DOM relacionados à entrega
const deliveryElements = {
  useLocationBtn: document.getElementById('use-location-btn'),
  deliveryInfo: document.getElementById('delivery-info'),
  deliveryDistance: document.getElementById('delivery-distance'),
  deliveryPrice: document.getElementById('delivery-price'),
  deliveryError: document.getElementById('delivery-error'),
  clientAddress: document.getElementById('client-address'),
  deliverySection: document.getElementById('delivery-section')
};

// Verificar se estamos na página de pedidos
if (window.location.pathname.includes('pedido')) {
  // Adicionar evento ao botão de usar localização quando o DOM estiver pronto
  document.addEventListener('DOMContentLoaded', () => {
    if (deliveryElements.useLocationBtn) {
      deliveryElements.useLocationBtn.addEventListener('click', showMapWithUserLocation);
    }
  });
}

// Mostrar mapa com a localização do usuário
function showMapWithUserLocation() {
  if (window.Mapa) {
    window.Mapa.showMapWithUserLocation();
  } else {
    // Fallback para o método antigo se o mapa não estiver disponível
    getLocation();
  }
}

// Obter localização do usuário (método antigo como fallback)
function getLocation() {
  if (navigator.geolocation) {
    // Mostrar mensagem de carregamento
    showDeliveryLoading();
    
    navigator.geolocation.getCurrentPosition(
      position => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        
        // Calcular entrega com as coordenadas obtidas
        calculateDelivery(latitude, longitude);
      },
      error => {
        handleLocationError(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  } else {
    showDeliveryError('Geolocalização não é suportada pelo seu navegador.');
  }
}

// Calcular valor da entrega
async function calculateDelivery(latitude, longitude) {
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
        // Fora da área de entrega ou erro específico
        showDeliveryError(data.error);
      } else {
        // Entrega válida
        showDeliveryInfo(data.distance, data.price);
        
        // Preencher o campo de endereço com o endereço convertido, se disponível
        if (data.endereco && deliveryElements.clientAddress) {
          deliveryElements.clientAddress.value = data.endereco;
        }
        
        // Salvar coordenadas no elemento hidden para envio com o pedido
        const coordsInput = document.getElementById('client-coordinates');
        if (coordsInput) {
          coordsInput.value = JSON.stringify({ lat: latitude, lng: longitude });
        }
      }
    } else {
      showDeliveryError(data.error || 'Erro ao calcular entrega.');
    }
  } catch (error) {
    console.error('Erro ao calcular entrega:', error);
    showDeliveryError('Erro ao calcular valor da entrega. Por favor, tente novamente.');
  }
}

// Mostrar informações da entrega
function showDeliveryInfo(distance, price) {
  if (deliveryElements.deliveryInfo) {
    deliveryElements.deliveryDistance.textContent = distance.toFixed(2);
    deliveryElements.deliveryPrice.textContent = price.toFixed(2).replace('.', ',');
    deliveryElements.deliveryInfo.style.display = 'block';
    deliveryElements.deliveryError.style.display = 'none';
    
    // Atualizar total do pedido
    updateOrderTotalWithDelivery(price);
  }
}

// Mostrar erro na entrega
function showDeliveryError(message) {
  if (deliveryElements.deliveryError) {
    // Se a mensagem for HTML, inserir como HTML, caso contrário como texto
    if (message.includes('<') && message.includes('>')) {
      deliveryElements.deliveryError.innerHTML = message;
    } else {
      deliveryElements.deliveryError.textContent = message;
    }
    deliveryElements.deliveryError.style.display = 'block';
    deliveryElements.deliveryInfo.style.display = 'none';
  }
}

// Mostrar estado de carregamento
function showDeliveryLoading() {
  if (deliveryElements.deliveryError) {
    deliveryElements.deliveryError.textContent = 'Obtendo sua localização...';
    deliveryElements.deliveryError.style.display = 'block';
    deliveryElements.deliveryInfo.style.display = 'none';
  }
}

// Atualizar total do pedido com o valor da entrega
function updateOrderTotalWithDelivery(deliveryPrice) {
  const orderTotalElement = document.getElementById('order-total');
  const cartTotalElement = document.getElementById('cart-total');
  
  if (orderTotalElement) {
    // Extrair valor atual
    const currentTotalText = orderTotalElement.textContent.replace('R$ ', '').replace(',', '.');
    const currentTotal = parseFloat(currentTotalText) || 0;
    
    // Calcular novo total
    const newTotal = currentTotal + deliveryPrice;
    
    // Atualizar exibição
    orderTotalElement.textContent = `R$ ${newTotal.toFixed(2).replace('.', ',')}`;
  }
  
  if (cartTotalElement) {
    // Extrair valor atual
    const currentTotalText = cartTotalElement.textContent.replace('R$ ', '').replace(',', '.');
    const currentTotal = parseFloat(currentTotalText) || 0;
    
    // Calcular novo total
    const newTotal = currentTotal + deliveryPrice;
    
    // Atualizar exibição
    cartTotalElement.textContent = `R$ ${newTotal.toFixed(2).replace('.', ',')}`;
  }
}

// Tratar erros de localização
function handleLocationError(error) {
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
  
  showDeliveryError(errorMessage);
}

// Exportar funções para uso global
window.Delivery = {
  getLocation,
  calculateDelivery
};