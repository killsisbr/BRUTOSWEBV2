// Função para escurecer cores
export function darkenColor(color, percent) {
  // Remover # se existir
  color = color.replace('#', '');
  
  // Converter para valores RGB
  let r = parseInt(color.substring(0, 2), 16);
  let g = parseInt(color.substring(2, 4), 16);
  let b = parseInt(color.substring(4, 6), 16);
  
  // Escurecer cada componente
  r = Math.max(0, r - Math.floor(r * percent / 100));
  g = Math.max(0, g - Math.floor(g * percent / 100));
  b = Math.max(0, b - Math.floor(b * percent / 100));
  
  // Converter de volta para hexadecimal
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Função para clarear cores
export function lightenColor(color, percent) {
  // Remover # se existir
  color = color.replace('#', '');
  
  // Converter para valores RGB
  let r = parseInt(color.substring(0, 2), 16);
  let g = parseInt(color.substring(2, 4), 16);
  let b = parseInt(color.substring(4, 6), 16);
  
  // Clarear cada componente
  r = Math.min(255, r + Math.floor((255 - r) * percent / 100));
  g = Math.min(255, g + Math.floor((255 - g) * percent / 100));
  b = Math.min(255, b + Math.floor((255 - b) * percent / 100));
  
  // Converter de volta para hexadecimal
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}