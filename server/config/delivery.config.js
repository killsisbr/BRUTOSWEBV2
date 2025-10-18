// Configuração do sistema de entrega
export const deliveryConfig = {
  // Coordenadas do restaurante (exemplo - substituir pelas coordenadas reais)
  restaurantCoordinates: {
    lat: -25.236655, // Latitude do restaurante
    lng: -50.601611  // Longitude do restaurante
  },
  
  // Regras de precificação por distância (em quilômetros)
  pricingRules: [
    { maxDistance: 4, price: 7.00 },     // Até 4km: R$ 7,00
    { maxDistance: 10, price: 15.00 },   // Até 10km: R$ 15,00
    { maxDistance: 20, price: 25.00 },   // Até 20km: R$ 25,00
    { maxDistance: 70, price: 65.00 }    // Até 70km: R$ 65,00 (valor máximo)
  ],
  
  // Área máxima de entrega em km
  maxDeliveryDistance: 70,
  
  // Mensagem quando fora da área de entrega
  outOfRangeMessage: "Desculpe, mas você está fora da nossa área de entrega (máximo de 70km)."
};