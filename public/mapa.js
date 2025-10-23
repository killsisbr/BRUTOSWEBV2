// Elementos do DOM relacionados ao mapa
const mapElements = {
  mapModal: document.getElementById('map-modal'),
  mapContainer: document.getElementById('map-container'),
  confirmLocationBtn: document.getElementById('confirm-location-btn'),
  cancelMapBtn: document.getElementById('cancel-map-btn'),
  closeButtons: document.querySelectorAll('.close-button'),
  useLocationBtn: document.getElementById('use-location-btn')
};

// Variáveis do mapa
let map;
let marker;
let userLocation;
let openRouteServiceLoaded = false;

// Verificar se estamos na página de pedidos
if (window.location.pathname.includes('pedido')) {
  // Adicionar eventos quando o DOM estiver pronto
  document.addEventListener('DOMContentLoaded', () => {
    initializeMapEvents();
  });
}

// Inicializar eventos do mapa
function initializeMapEvents() {
  // Adicionar evento ao botão de usar localização
  if (mapElements.useLocationBtn) {
    mapElements.useLocationBtn.addEventListener('click', showMapWithUserLocation);
  }
  
  // Adicionar evento ao botão de confirmar localização
  if (mapElements.confirmLocationBtn) {
    mapElements.confirmLocationBtn.addEventListener('click', confirmLocation);
  }
  
  // Adicionar evento ao botão de cancelar
  if (mapElements.cancelMapBtn) {
    mapElements.cancelMapBtn.addEventListener('click', closeMapModal);
  }
  
  // Adicionar evento aos botões de fechar
  if (mapElements.closeButtons) {
    mapElements.closeButtons.forEach(button => {
      button.addEventListener('click', closeMapModal);
    });
  }
  
  // Fechar modal ao clicar fora
  if (mapElements.mapModal) {
    mapElements.mapModal.addEventListener('click', (e) => {
      if (e.target === mapElements.mapModal) {
        closeMapModal();
      }
    });
  }
}

// Mostrar mapa com a localização do usuário
function showMapWithUserLocation() {
  if (navigator.geolocation) {
    // Mostrar mensagem de carregamento
    showDeliveryLoading();
    
    navigator.geolocation.getCurrentPosition(
      position => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        userLocation = { lat: latitude, lng: longitude };
        
        // Abrir modal do mapa
        openMapModal(latitude, longitude);
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

// Abrir modal do mapa
function openMapModal(lat, lng) {
  // Carregar a API do OpenRouteService se ainda não estiver carregada
  if (!openRouteServiceLoaded) {
    loadOpenRouteServiceAPI(() => {
      openRouteServiceLoaded = true;
      initMap(lat, lng);
      showMapModal();
    });
  } else {
    initMap(lat, lng);
    showMapModal();
  }
}

// Carregar API do OpenRouteService
function loadOpenRouteServiceAPI(callback) {
  // Verificar se já está carregada
  if (typeof L !== 'undefined' && L.map) {
    callback();
    return;
  }
  
  // Verificar se o script já foi adicionado
  if (document.querySelector('script[src*="leaflet"]')) {
    // Aguardar o carregamento
    const checkInterval = setInterval(() => {
      if (typeof L !== 'undefined' && L.map) {
        clearInterval(checkInterval);
        callback();
      }
    }, 100);
    return;
  }
  
  // Carregar Leaflet CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
  
  // Carregar Leaflet JS
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.async = true;
  script.defer = true;
  
  script.onload = function() {
    callback();
  };
  
  script.onerror = function() {
    showDeliveryError('Erro ao carregar a API do mapa. Verifique sua conexão.');
  };
  
  document.head.appendChild(script);
}

// Inicializar o mapa
function initMap(lat, lng) {
  // Verificar se o contêiner do mapa existe
  if (!mapElements.mapContainer) {
    console.error('Contêiner do mapa não encontrado');
    return;
  }
  
  const location = [lat, lng];
  
  // Criar mapa com OpenStreetMap
  if (map) {
    map.remove();
  }
  
  map = L.map(mapElements.mapContainer).setView(location, 16);
  
  // Adicionar camada do OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  
  // Criar marcador draggable
  if (marker) {
    map.removeLayer(marker);
  }
  
  marker = L.marker(location, { draggable: true }).addTo(map);
  marker.bindPopup('Arraste para ajustar a localização').openPopup();
  
  // Adicionar evento para quando o marcador for arrastado
  marker.on('dragend', function() {
    const position = marker.getLatLng();
    userLocation = { lat: position.lat, lng: position.lng };
  });
  
  // Adicionar evento para quando o mapa for clicado
  map.on('click', function(event) {
    marker.setLatLng(event.latlng);
    userLocation = { lat: event.latlng.lat, lng: event.latlng.lng };
  });
}

// Mostrar modal do mapa
function showMapModal() {
  if (mapElements.mapModal) {
    mapElements.mapModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
}

// Fechar modal do mapa
function closeMapModal() {
  if (mapElements.mapModal) {
    mapElements.mapModal.classList.remove('show');
    document.body.style.overflow = 'auto';
  }
}

// Confirmar localização selecionada
function confirmLocation() {
  if (userLocation) {
    // Calcular entrega com a localização selecionada
    calculateDelivery(userLocation.lat, userLocation.lng);
    
    // Fechar modal
    closeMapModal();
  }
}

// Mostrar estado de carregamento (reutilizando função existente)
function showDeliveryLoading() {
  const deliveryError = document.getElementById('delivery-error');
  const deliveryInfo = document.getElementById('delivery-info');
  
  if (deliveryError) {
    deliveryError.textContent = 'Obtendo sua localização...';
    deliveryError.style.display = 'block';
    if (deliveryInfo) {
      deliveryInfo.style.display = 'none';
    }
  }
}

// Mostrar erro na entrega (reutilizando função existente)
function showDeliveryError(message) {
  const deliveryError = document.getElementById('delivery-error');
  const deliveryInfo = document.getElementById('delivery-info');
  
  if (deliveryError) {
    // Se a mensagem for HTML, inserir como HTML, caso contrário como texto
    if (message.includes('<') && message.includes('>')) {
      deliveryError.innerHTML = message;
    } else {
      deliveryError.textContent = message;
    }
    deliveryError.style.display = 'block';
    if (deliveryInfo) {
      deliveryInfo.style.display = 'none';
    }
  }
}

// Calcular valor da entrega (reutilizando função existente)
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
        
        // Atualizar informações de entrega no objeto global mesmo quando há erro
        // Isso é importante para que o sistema reconheça que a entrega foi calculada
        if (typeof window !== 'undefined') {
          window.entregaInfo = {
            distance: data.distance || 0,
            price: data.price || 0,
            coordinates: { lat: latitude, lng: longitude }
          };
        }
      } else {
        // Entrega válida
        showDeliveryInfo(data.distance, data.price);
        
        // Preencher o campo de endereço com o endereço convertido, se disponível
        const clientAddress = document.getElementById('client-address');
        if (data.endereco && clientAddress) {
          clientAddress.value = data.endereco;
        }
        
        // Salvar coordenadas no elemento hidden para envio com o pedido
        const coordsInput = document.getElementById('client-coordinates');
        if (coordsInput) {
          coordsInput.value = JSON.stringify({ lat: latitude, lng: longitude });
        }
        
        // Atualizar informações de entrega no objeto global
        if (typeof window !== 'undefined') {
          window.entregaInfo = {
            distance: data.distance,
            price: data.price,
            coordinates: { lat: latitude, lng: longitude }
          };
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

// Mostrar informações da entrega (reutilizando função existente)
function showDeliveryInfo(distance, price) {
  const deliveryInfo = document.getElementById('delivery-info');
  const deliveryDistance = document.getElementById('delivery-distance');
  const deliveryPrice = document.getElementById('delivery-price');
  const deliveryError = document.getElementById('delivery-error');
  
  if (deliveryInfo && deliveryDistance && deliveryPrice) {
    deliveryDistance.textContent = distance.toFixed(2);
    deliveryPrice.textContent = price.toFixed(2).replace('.', ',');
    deliveryInfo.style.display = 'block';
    if (deliveryError) {
      deliveryError.style.display = 'none';
    }
    
    // Atualizar total do pedido
    updateOrderTotalWithDelivery(price);
            
    // Atualizar informações de entrega no objeto global
    if (typeof window !== 'undefined') {
      window.entregaInfo = {
        distance: distance,
        price: price,
        coordinates: userLocation || { lat: 0, lng: 0 }
      };
    }
  }
}

// Atualizar total do pedido com o valor da entrega (reutilizando função existente)
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

// Tratar erros de localização (reutilizando função existente)
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
window.Mapa = {
  showMapWithUserLocation,
  openMapModal,
  closeMapModal
};