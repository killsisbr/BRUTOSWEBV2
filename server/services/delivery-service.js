import axios from 'axios';
import { deliveryConfig } from '../config/delivery.config.js';

class DeliveryService {
  constructor() {
    // Coordenadas do restaurante (usar variáveis de ambiente se disponíveis)
    this.restaurantCoordinates = {
      lat: process.env.RESTAURANT_LATITUDE ? parseFloat(process.env.RESTAURANT_LATITUDE) : deliveryConfig.restaurantCoordinates.lat,
      lng: process.env.RESTAURANT_LONGITUDE ? parseFloat(process.env.RESTAURANT_LONGITUDE) : deliveryConfig.restaurantCoordinates.lng
    };
    
    // Chave da API OpenRouteService
    this.orsApiKey = process.env.ORS_API_KEY || '5b3ce3597851110001cf6248cfa0914bbad64af78bc4d5aad8b296fb';
    
    // Regras de precificação
    this.pricingRules = deliveryConfig.pricingRules;
    
    // Distância máxima de entrega
    this.maxDeliveryDistance = deliveryConfig.maxDeliveryDistance;
  }

  // Calcular distância entre duas coordenadas usando OpenRouteService
  async calculateDistance(origin, destination) {
    try {
      // Verificar se as coordenadas são idênticas
      if (origin.lat === destination.lat && origin.lng === destination.lng) {
        return 0; // Distância zero quando as coordenadas são iguais
      }
      
      const url = 'https://api.openrouteservice.org/v2/directions/driving-car';
      const coords = {
        coordinates: [
          [origin.lng, origin.lat],
          [destination.lng, destination.lat]
        ]
      };

      const response = await axios.post(url, coords, {
        headers: {
          'Authorization': this.orsApiKey,
          'Content-Type': 'application/json'
        }
      });

      // Verifica se a resposta tem dados de rota válidos
      if (response.data && response.data.routes && response.data.routes[0] && response.data.routes[0].summary) {
        const metros = response.data.routes[0].summary.distance;
        return metros / 1000; // Converte metros para km
      } else {
        throw new Error('Não foi possível calcular a distância');
      }
    } catch (error) {
      console.error('Erro ao calcular distância:', error);
      // Em caso de erro, usar cálculo aproximado
      return this.calculateApproximateDistance(origin, destination);
    }
  }

  // Cálculo aproximado de distância usando fórmula de Haversine
  calculateApproximateDistance(origin, destination) {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRadians(destination.lat - origin.lat);
    const dLon = this.toRadians(destination.lng - origin.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(origin.lat)) * Math.cos(this.toRadians(destination.lat)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  // Converter graus para radianos
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Calcular valor da entrega com base na distância
  calculateDeliveryPrice(distance) {
    // Verificar se está fora da área de entrega
    if (distance > this.maxDeliveryDistance) {
      return {
        distance: distance,
        price: null,
        error: deliveryConfig.outOfRangeMessage
      };
    }
    
    // Encontrar a regra de precificação apropriada
    let price = 0;
    for (const rule of this.pricingRules) {
      if (distance <= rule.maxDistance) {
        price = rule.price;
        break;
      }
    }
    
    return {
      distance: distance,
      price: parseFloat(price.toFixed(2)),
      error: null
    };
  }

  // Verificar se as coordenadas estão em Imbituva
  async verificarSeEstaEmImbituva(lat, lng) {
    try {
      const url = `https://api.openrouteservice.org/geocode/reverse`;
      const response = await axios.get(url, {
        params: {
          api_key: this.orsApiKey,
          'point.lon': lng,
          'point.lat': lat,
          size: 1
        }
      });

      if (response.data && response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        const endereco = feature.properties.label || '';
        
        // Verifica se o endereço contém "Imbituva"
        if (endereco.toLowerCase().includes('imbituva')) {
          console.log(`Localização válida em Imbituva: ${endereco}`);
          return true;
        } else {
          console.log(`Localização fora de Imbituva: ${endereco}`);
          return false;
        }
      }
      
      console.warn('Geocodificação reversa não retornou resultados.');
      return false;
    } catch (error) {
      console.error('Erro na verificação de cidade:', error.message);
      // Em caso de erro na API, assume que está em Imbituva para não bloquear o serviço
      return true;
    }
  }

  // Converter coordenadas em endereço usando OpenRouteService
  async converterCoordenadasEmEndereco(lat, lng) {
    try {
      const url = `https://api.openrouteservice.org/geocode/reverse`;
      const response = await axios.get(url, {
        params: {
          api_key: this.orsApiKey,
          'point.lon': lng,
          'point.lat': lat,
          size: 1
        }
      });

      if (response.data && response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        const endereco = feature.properties.label || '';
        return endereco;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao converter coordenadas em endereço:', error.message);
      return null;
    }
  }

  // Processar coordenadas do cliente e calcular entrega
  async processDelivery(clientCoordinates) {
    try {
      // Verificar se a localização está em Imbituva
      const cidadeValida = await this.verificarSeEstaEmImbituva(clientCoordinates.lat, clientCoordinates.lng);
      
      if (!cidadeValida) {
        return {
          success: false,
          error: "❌ *Atendemos apenas em Imbituva!*\n\nSua localização não está em Imbituva, PR. Por favor, digite um endereço em Imbituva ou verifique se sua localização está correta.\n\n_Exemplo: Rua das Flores, 123, Centro, Imbituva_"
        };
      }

      // Calcular distância entre restaurante e cliente
      const distance = await this.calculateDistance(
        this.restaurantCoordinates,
        clientCoordinates
      );
      
      // Calcular valor da entrega
      const deliveryInfo = this.calculateDeliveryPrice(distance);
      
      // Converter coordenadas em endereço
      const endereco = await this.converterCoordenadasEmEndereco(clientCoordinates.lat, clientCoordinates.lng);
      
      return {
        success: true,
        distance: deliveryInfo.distance,
        price: deliveryInfo.price,
        error: deliveryInfo.error,
        coordinates: clientCoordinates,
        endereco: endereco // Adicionando o endereço convertido
      };
    } catch (error) {
      console.error('Erro ao processar entrega:', error);
      return {
        success: false,
        error: 'Erro ao calcular entrega. Por favor, tente novamente.'
      };
    }
  }

  // Processar localização recebida via WhatsApp
  async processWhatsAppLocation(latitude, longitude) {
    try {
      const clientCoordinates = {
        lat: parseFloat(latitude),
        lng: parseFloat(longitude)
      };
      
      return await this.processDelivery(clientCoordinates);
    } catch (error) {
      console.error('Erro ao processar localização do WhatsApp:', error);
      return {
        success: false,
        error: 'Erro ao processar localização recebida.'
      };
    }
  }
}

export default DeliveryService;