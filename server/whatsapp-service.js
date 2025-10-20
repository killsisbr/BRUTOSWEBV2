import pkg from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client, LocalAuth } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para salvar as sessões
const SESSIONS_DIR = path.join(__dirname, 'whatsapp-sessions');
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

class WhatsAppService {
  constructor() {
    this.client = null;
    this.clients = new Map(); // Para armazenar dados temporários dos clientes
    this.groupId = process.env.WHATSAPP_GROUP_ID || null; // ID do grupo para envio de pedidos
  }

  // Inicializar o cliente do WhatsApp
  initialize() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'brutus-web',
        dataPath: SESSIONS_DIR
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      }
    });

    this.client.on('qr', qr => {
      console.log('QR Code recebido, escaneie com seu WhatsApp:');
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      console.log('Cliente do WhatsApp pronto!');
    });

    this.client.on('message', async message => {
      await this.handleMessage(message);
    });

    this.client.initialize();
  }

  // Manipular mensagens recebidas
  async handleMessage(message) {
    const chat = await message.getChat();
    const contact = await message.getContact();
    const whatsappId = contact.id._serialized;
    
    // Ignorar mensagens de grupos e transmissões
    if (chat.isGroup) {
      console.log(`Mensagem de grupo ignorada de ${contact.pushname} (${whatsappId}): ${message.body}`);
      return;
    }
    
    if (message.broadcast) {
      console.log(`Mensagem de transmissão ignorada de ${contact.pushname} (${whatsappId}): ${message.body}`);
      return;
    }
    
    console.log(`Mensagem recebida de ${contact.pushname} (${whatsappId}): ${message.body}`);

    // Comandos disponíveis
    if (message.body.toLowerCase() === 'oi' || message.body.toLowerCase() === 'olá' || message.body.toLowerCase() === 'ola') {
      await this.sendWelcomeMessage(chat, whatsappId);
    } else if (message.body.toLowerCase().startsWith('pedido')) {
      await this.handleOrderRequest(chat, whatsappId);
    } else if (message.body.toLowerCase() === 'ajuda') {
      await this.sendHelpMessage(chat);
    }
  }

  // Enviar mensagem de boas-vindas
  async sendWelcomeMessage(chat, whatsappId) {
    const welcomeMessage = `Olá! Bem-vindo ao Brutus Burger! 🍔
    
Eu sou o robô de atendimento do Brutus Burger. Posso te ajudar a fazer pedidos rapidamente!

Comandos disponíveis:
• *pedido* - Criar um novo pedido
• *ajuda* - Ver esta mensagem de ajuda

Vamos começar? Digite *pedido* para criar seu pedido!`;
    
    await chat.sendMessage(welcomeMessage);
  }

  // Enviar mensagem de ajuda
  async sendHelpMessage(chat) {
    const helpMessage = `🤖 Comandos disponíveis:
    
• *pedido* - Criar um novo pedido
• *ajuda* - Ver esta mensagem de ajuda

Para fazer um pedido:
1. Digite *pedido*
2. Siga as instruções para selecionar seus itens
3. Confirme suas informações
4. Receba o link do seu pedido

Qualquer dúvida, estou aqui para ajudar!`;
    
    await chat.sendMessage(helpMessage);
  }

  // Manipular solicitação de pedido
  async handleOrderRequest(chat, whatsappId) {
    const orderMessage = `🍔 Vamos criar seu pedido!
    
Clique no link abaixo para acessar seu pedido personalizado:
https://brutusburger.online/pedido?whatsapp=${encodeURIComponent(whatsappId)}

Após finalizar seu pedido no site, você receberá um resumo aqui no WhatsApp!`;
    
    await chat.sendMessage(orderMessage);
  }

  // Enviar resumo do pedido
  async sendOrderSummary(chat, orderData) {
    let itemsList = '';
    let total = 0;
    
    orderData.itens.forEach(item => {
      const itemTotal = item.produto.preco * item.quantidade;
      total += itemTotal;
      itemsList += `• ${item.quantidade}x ${item.produto.nome} - R$ ${itemTotal.toFixed(2).replace('.', ',')}\n`;
    });
    
    const summaryMessage = `✅ *Pedido Confirmado!*
    
Número do pedido: *#${orderData.pedidoId}*
Link para acompanhar seu pedido: https://brutusburger.online/pedido/${orderData.pedidoId}
    
Itens:
${itemsList}
*Total: R$ ${total.toFixed(2).replace('.', ',')}*

Informações do cliente:
Nome: ${orderData.cliente.nome}
Telefone: ${orderData.cliente.telefone}
Endereço: ${orderData.cliente.endereco}
Forma de pagamento: ${orderData.cliente.pagamento}

Seu pedido será preparado e entregue em breve! 🛵`;
    
    await chat.sendMessage(summaryMessage);
  }

  // Enviar notificação de status do pedido
  async sendOrderStatusUpdate(chat, orderId, status) {
    const statusMessages = {
      'preparando': '🍽 Seu pedido está sendo preparado!',
      'pronto': '✅ Seu pedido está pronto e será entregue em breve!',
      'entregue': '🎉 Seu pedido foi entregue! Agradecemos sua preferência!'
    };
    
    const statusMessage = `📢 *Atualização do Pedido #${orderId}*
    
${statusMessages[status] || 'Seu pedido foi atualizado!'}`;
    
    await chat.sendMessage(statusMessage);
  }

  // Enviar detalhes do pedido para o grupo dos motoboys
  async sendOrderToDeliveryGroup(orderData) {
    // Verificar se o ID do grupo foi configurado
    if (!this.groupId) {
      console.log('ID do grupo do WhatsApp não configurado. Não é possível enviar pedido para o grupo.');
      return;
    }

    try {
      // Obter o chat do grupo
      const groupChat = await this.client.getChatById(this.groupId);
      
      // Preparar a lista de itens
      let itemsList = '';
      let total = 0;
      
      orderData.itens.forEach(item => {
        const itemTotal = item.produto.preco * item.quantidade;
        total += itemTotal;
        itemsList += `• ${item.quantidade}x ${item.produto.nome} - R$ ${itemTotal.toFixed(2).replace('.', ',')}\n`;
      });
      
      // Verificar se há informações de entrega
      let deliveryInfo = '';
      if (orderData.entrega && orderData.entrega.coordenadas) {
        const { lat, lng } = orderData.entrega.coordenadas;
        deliveryInfo = `
📍 *Localização*: https://www.google.com/maps?q=${lat},${lng}
`;
      }
      
      // Verificar se há informações de troco
      let changeInfo = '';
      if (orderData.cliente.troco !== null && orderData.cliente.troco !== undefined) {
        const valorPago = parseFloat(orderData.cliente.troco);
        const total = orderData.total;
        
        // Se o valor pago for 0, significa que o cliente quer troco sem especificar valor
        if (valorPago === 0) {
          changeInfo = `💵 *Troco*: Cliente deseja troco (valor não especificado)\n`;
        } else if (valorPago > total) {
          const change = valorPago - total;
          changeInfo = `💵 *Troco*: R$ ${change.toFixed(2).replace('.', ',')} (para R$ ${valorPago.toFixed(2).replace('.', ',')})\n`;
        } else if (valorPago === total) {
          changeInfo = `💵 *Troco*: Sem troco (valor exato)\n`;
        }
      }
      
      // Criar link para o WhatsApp do cliente
      let clientWhatsAppLink = '';
      if (orderData.cliente.telefone) {
        // Remover caracteres não numéricos do telefone
        const cleanPhone = orderData.cliente.telefone.replace(/\D/g, '');
        clientWhatsAppLink = `📱 *WhatsApp do Cliente*: https://wa.me/${cleanPhone}\n`;
      }
      
      // Montar a mensagem para o grupo
      const groupMessage = `🍔 *NOVO PEDIDO #${orderData.pedidoId}*
Link para acompanhar o pedido: https://brutusburger.online/pedido/${orderData.pedidoId}
      
Itens:
${itemsList}
*Total: R$ ${total.toFixed(2).replace('.', ',')}*

Informações do Cliente:
👤 Nome: ${orderData.cliente.nome}
🏠 Endereço: ${orderData.cliente.endereco}
💳 Forma de Pagamento: ${orderData.cliente.pagamento}
${changeInfo}${clientWhatsAppLink}${deliveryInfo}

Hotéis para o motoboy:
1. Confirmar recebimento do pedido
2. Coletar o pedido no restaurante
3. Entregar no endereço acima
4. Informar status no sistema`;

      // Enviar a mensagem para o grupo
      await groupChat.sendMessage(groupMessage);
      console.log(`Pedido #${orderData.pedidoId} enviado para o grupo de entregas`);
    } catch (error) {
      console.error('Erro ao enviar pedido para o grupo de entregas:', error);
    }
  }
}

export default WhatsAppService;