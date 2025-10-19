// Estado da aplicação
let customSettings = {
  restaurantName: 'Brutus Burger',
  contact: '(42) 9 99830-2047',
  primaryColor: '#27ae60',
  secondaryColor: '#f39c12',
  backgroundColor: '#121212',
  pixKey: '',
  pixName: '',
  logo: null,
  theme: 'dark'
};

// Elementos do DOM
const elements = {
  restaurantName: document.getElementById('restaurant-name'),
  restaurantContact: document.getElementById('restaurant-contact'),
  primaryColor: document.getElementById('primary-color'),
  primaryColorValue: document.getElementById('primary-color-value'),
  secondaryColor: document.getElementById('secondary-color'),
  secondaryColorValue: document.getElementById('secondary-color-value'),
  backgroundColor: document.getElementById('background-color'),
  backgroundColorValue: document.getElementById('background-color-value'),
  pixKey: document.getElementById('pix-key'),
  pixName: document.getElementById('pix-name'),
  logoUpload: document.getElementById('logo-upload'),
  logoPreview: document.getElementById('logo-preview'),
  themeSelector: document.getElementById('theme-selector'),
  saveSettings: document.getElementById('save-settings'),
  previewRestaurantName: document.getElementById('preview-restaurant-name')
};

// Carregar configurações salvas
async function loadSettings() {
  try {
    const response = await fetch('/api/custom-settings');
    if (response.ok) {
      const savedSettings = await response.json();
      customSettings = savedSettings;
    }
    
    // Preencher campos do formulário
    elements.restaurantName.value = customSettings.restaurantName;
    elements.restaurantContact.value = customSettings.contact;
    elements.primaryColor.value = customSettings.primaryColor;
    elements.primaryColorValue.value = customSettings.primaryColor;
    elements.secondaryColor.value = customSettings.secondaryColor;
    elements.secondaryColorValue.value = customSettings.secondaryColor;
    elements.backgroundColor.value = customSettings.backgroundColor;
    elements.backgroundColorValue.value = customSettings.backgroundColor;
    elements.pixKey.value = customSettings.pixKey;
    elements.pixName.value = customSettings.pixName;
    elements.themeSelector.value = customSettings.theme;
    elements.previewRestaurantName.textContent = customSettings.restaurantName;
    
    // Aplicar cores ao preview
    applyColorsToPreview();
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
  }
}

// Salvar configurações
async function saveSettings() {
  try {
    // Atualizar objeto de configurações
    customSettings.restaurantName = elements.restaurantName.value;
    customSettings.contact = elements.restaurantContact.value;
    customSettings.primaryColor = elements.primaryColor.value;
    customSettings.secondaryColor = elements.secondaryColor.value;
    customSettings.backgroundColor = elements.backgroundColor.value;
    customSettings.pixKey = elements.pixKey.value;
    customSettings.pixName = elements.pixName.value;
    customSettings.theme = elements.themeSelector.value;
    
    // Salvar no servidor
    const response = await fetch('/api/custom-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(customSettings)
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Aplicar cores ao preview
      applyColorsToPreview();
      
      // Mostrar notificação de sucesso
      showNotification('Configurações salvas com sucesso!');
    } else {
      showNotification('Erro ao salvar configurações: ' + result.error, 'error');
    }
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    showNotification('Erro ao salvar configurações!', 'error');
  }
}

// Aplicar cores ao preview
function applyColorsToPreview() {
  const previewContainer = document.getElementById('preview-container');
  if (previewContainer) {
    previewContainer.style.setProperty('--preview-primary', customSettings.primaryColor);
    previewContainer.style.setProperty('--preview-secondary', customSettings.secondaryColor);
    previewContainer.style.setProperty('--preview-background', customSettings.backgroundColor);
  }
  
  // Atualizar nome do restaurante no preview
  if (elements.previewRestaurantName) {
    elements.previewRestaurantName.textContent = customSettings.restaurantName;
  }
}

// Mostrar notificação
function showNotification(message, type = 'success') {
  // Criar elemento de notificação
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
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

// Atualizar valor da cor quando o picker muda
function setupColorPickers() {
  elements.primaryColor.addEventListener('input', () => {
    elements.primaryColorValue.value = elements.primaryColor.value;
  });
  
  elements.secondaryColor.addEventListener('input', () => {
    elements.secondaryColorValue.value = elements.secondaryColor.value;
  });
  
  elements.backgroundColor.addEventListener('input', () => {
    elements.backgroundColorValue.value = elements.backgroundColor.value;
  });
  
  // Atualizar picker quando o valor textual muda
  elements.primaryColorValue.addEventListener('input', () => {
    if (/^#[0-9A-F]{6}$/i.test(elements.primaryColorValue.value)) {
      elements.primaryColor.value = elements.primaryColorValue.value;
    }
  });
  
  elements.secondaryColorValue.addEventListener('input', () => {
    if (/^#[0-9A-F]{6}$/i.test(elements.secondaryColorValue.value)) {
      elements.secondaryColor.value = elements.secondaryColorValue.value;
    }
  });
  
  elements.backgroundColorValue.addEventListener('input', () => {
    if (/^#[0-9A-F]{6}$/i.test(elements.backgroundColorValue.value)) {
      elements.backgroundColor.value = elements.backgroundColorValue.value;
    }
  });
}

// Configurar preview da logo
function setupLogoPreview() {
  elements.logoUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        elements.logoPreview.innerHTML = `<img src="${event.target.result}" alt="Logo Preview" style="max-width: 200px; max-height: 100px;">`;
        customSettings.logo = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  setupColorPickers();
  setupLogoPreview();
  
  // Adicionar evento para o botão de voltar
  const backToAdminBtn = document.getElementById('back-to-admin');
  if (backToAdminBtn) {
    backToAdminBtn.addEventListener('click', () => {
      window.location.href = '/admin.html';
    });
  }
});

elements.saveSettings.addEventListener('click', saveSettings);

// Atualizar preview em tempo real
Object.values(elements).forEach(element => {
  if (element && element.addEventListener) {
    element.addEventListener('input', applyColorsToPreview);
  }
});