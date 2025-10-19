import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import multer from 'multer';
import WhatsAppService from './whatsapp-service.js';
import DeliveryService from './services/delivery-service.js';
import { darkenColor, lightenColor } from './helpers/colorHelper.js';

// Carregar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3005;

// Configurar EJS como template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Middleware para parsing de JSON
app.use(express.json());

// Middleware para parsing de formulários
app.use(express.urlencoded({ extended: true }));

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gerar nome único para o arquivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  },
  fileFilter: (req, file, cb) => {
    // Aceitar apenas imagens
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos!'));
    }
  }
});

// Diretório para armazenar imagens
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Servir arquivos de upload
app.use('/uploads', express.static(uploadDir));

// Banco de dados será inicializado depois
let db;
let whatsappService;
let deliveryService;

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Rota para pedidos via WhatsApp
app.get('/pedido', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pedido.html'));
});

// Rota para página de personalização
app.get('/custom', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/custom.html'));
});

// Endpoint para pegar produtos
app.get('/api/produtos', async (req, res) => {
  try {
    const produtos = await db.all('SELECT * FROM produtos');
    res.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// Endpoint para obter a chave da API do Google Maps
app.get('/api/config/google-maps-key', (req, res) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || 'SuaChaveDaApiAqui';
  res.json({ apiKey });
});

// Endpoint para calcular valor da entrega
app.post('/api/entrega/calcular', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Coordenadas não fornecidas' 
      });
    }
    
    const result = await deliveryService.processDelivery({
      lat: parseFloat(latitude),
      lng: parseFloat(longitude)
    });
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao calcular entrega:', error);
    res.status(500).json({ 
      error: 'Erro ao calcular valor da entrega' 
    });
  }
});

// Endpoint para criar pedido
app.post('/api/pedidos', async (req, res) => {
  try {
    const { cliente, itens, total, entrega } = req.body;
    
    // Inserir pedido
    const result = await db.run(
      'INSERT INTO pedidos (cliente_nome, cliente_telefone, cliente_endereco, forma_pagamento, total, distancia, valor_entrega, coordenadas_cliente, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))',
      [cliente.nome, cliente.telefone, cliente.endereco, cliente.pagamento, total, entrega?.distancia || null, entrega?.valor || null, entrega?.coordenadas ? JSON.stringify(entrega.coordenadas) : null]
    );
    
    const pedidoId = result.lastID;
    
    // Inserir itens do pedido
    for (const item of itens) {
      await db.run(
        'INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)',
        [pedidoId, item.produto.id, item.quantidade, item.produto.preco]
      );
    }
    
    // Se houver um ID do WhatsApp, enviar resumo do pedido
    if (cliente.whatsappId) {
      // Enviar notificação via WhatsApp (em background)
      setImmediate(async () => {
        try {
          const chat = await whatsappService.client.getChatById(cliente.whatsappId);
          await whatsappService.sendOrderSummary(chat, {
            pedidoId,
            cliente,
            itens,
            total
          });
        } catch (error) {
          console.error('Erro ao enviar notificação via WhatsApp:', error);
        }
      });
    }
    
    // Enviar pedido para o grupo de entregas (em background)
    setImmediate(async () => {
      try {
        // Passar as informações completas do cliente, incluindo pagamento e troco
        await whatsappService.sendOrderToDeliveryGroup({
          pedidoId,
          cliente: {
            ...cliente,
            pagamento: cliente.pagamento,
            troco: cliente.troco
          },
          itens,
          total,
          entrega
        });
      } catch (error) {
        console.error('Erro ao enviar pedido para o grupo de entregas:', error);
      }
    });
    
    res.json({ 
      success: true, 
      pedidoId: pedidoId,
      message: 'Pedido criado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

// Endpoint para buscar pedidos com itens
app.get('/api/pedidos', async (req, res) => {
  try {
    // Buscar pedidos com informações do cliente
    const pedidos = await db.all(`
      SELECT p.*, 
             c.nome as cliente_nome,
             c.telefone as cliente_telefone,
             c.endereco as cliente_endereco
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_nome = c.nome
      ORDER BY p.data DESC
    `);
    
    // Buscar itens de cada pedido
    for (const pedido of pedidos) {
      pedido.itens = await db.all(`
        SELECT pi.*, pr.nome as produto_nome
        FROM pedido_itens pi
        LEFT JOIN produtos pr ON pi.produto_id = pr.id
        WHERE pi.pedido_id = ?
      `, [pedido.id]);
      
      // Adicionar status (por padrão, 'pending' para pedidos novos)
      pedido.status = pedido.status || 'pending';
    }
    
    res.json(pedidos);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

// Endpoint para obter estatísticas de produtos mais vendidos
app.get('/api/estatisticas/produtos-mais-vendidos', async (req, res) => {
  try {
    const produtosMaisVendidos = await db.all(`
      SELECT 
        pr.nome as produto_nome,
        pr.categoria as produto_categoria,
        SUM(pi.quantidade) as total_vendido,
        SUM(pi.quantidade * pi.preco_unitario) as valor_total
      FROM pedido_itens pi
      JOIN produtos pr ON pi.produto_id = pr.id
      JOIN pedidos p ON pi.pedido_id = p.id
      WHERE p.status != 'archived'
      GROUP BY pi.produto_id, pr.nome, pr.categoria
      ORDER BY total_vendido DESC
      LIMIT 10
    `);
    
    res.json(produtosMaisVendidos);
  } catch (error) {
    console.error('Erro ao buscar produtos mais vendidos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos mais vendidos' });
  }
});

// Endpoint para obter estatísticas de melhores clientes
app.get('/api/estatisticas/melhores-clientes', async (req, res) => {
  try {
    const melhoresClientes = await db.all(`
      SELECT 
        c.nome as cliente_nome,
        c.telefone as cliente_telefone,
        COUNT(p.id) as total_pedidos,
        SUM(p.total) as valor_total_gasto
      FROM clientes c
      JOIN pedidos p ON c.nome = p.cliente_nome
      WHERE p.status != 'archived'
      GROUP BY c.id, c.nome, c.telefone
      ORDER BY valor_total_gasto DESC
      LIMIT 10
    `);
    
    res.json(melhoresClientes);
  } catch (error) {
    console.error('Erro ao buscar melhores clientes:', error);
    res.status(500).json({ error: 'Erro ao buscar melhores clientes' });
  }
});

// Endpoint para obter estatísticas de valores de entrega
app.get('/api/estatisticas/valores-entrega', async (req, res) => {
  try {
    const valoresEntrega = await db.all(`
      SELECT 
        SUM(valor_entrega) as total_valor_entregas,
        AVG(valor_entrega) as media_valor_entregas,
        COUNT(*) as total_entregas
      FROM pedidos
      WHERE valor_entrega IS NOT NULL AND status != 'archived'
    `);
    
    res.json(valoresEntrega[0] || { total_valor_entregas: 0, media_valor_entregas: 0, total_entregas: 0 });
  } catch (error) {
    console.error('Erro ao buscar valores de entrega:', error);
    res.status(500).json({ error: 'Erro ao buscar valores de entrega' });
  }
});

// Endpoint para obter estatísticas gerais
app.get('/api/estatisticas/gerais', async (req, res) => {
  try {
    const estatisticasGerais = await db.all(`
      SELECT 
        COUNT(*) as total_pedidos,
        SUM(total) as valor_total_pedidos,
        AVG(total) as ticket_medio,
        COUNT(DISTINCT cliente_nome) as total_clientes
      FROM pedidos
      WHERE status != 'archived'
    `);
    
    res.json(estatisticasGerais[0] || { total_pedidos: 0, valor_total_pedidos: 0, ticket_medio: 0, total_clientes: 0 });
  } catch (error) {
    console.error('Erro ao buscar estatísticas gerais:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas gerais' });
  }
});

// Endpoint para buscar informações do cliente pelo WhatsApp ID
app.get('/api/clientes/:whatsappId', async (req, res) => {
  try {
    const { whatsappId } = req.params;
    const cliente = await db.get(
      'SELECT * FROM clientes WHERE whatsapp_id = ?',
      [whatsappId]
    );
    
    if (cliente) {
      res.json({ success: true, cliente });
    } else {
      res.json({ success: false, message: 'Cliente não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
});

// Endpoint para salvar/atualizar informações do cliente
app.post('/api/clientes', async (req, res) => {
  try {
    const { whatsappId, nome, telefone, endereco } = req.body;
    
    // Verificar se o cliente já existe
    const clienteExistente = await db.get(
      'SELECT * FROM clientes WHERE whatsapp_id = ?',
      [whatsappId]
    );
    
    if (clienteExistente) {
      // Atualizar informações do cliente existente
      await db.run(
        'UPDATE clientes SET nome = ?, telefone = ?, endereco = ?, data_atualizacao = datetime("now") WHERE whatsapp_id = ?',
        [nome, telefone, endereco, whatsappId]
      );
      res.json({ success: true, message: 'Informações do cliente atualizadas com sucesso!' });
    } else {
      // Criar novo cliente
      await db.run(
        'INSERT INTO clientes (whatsapp_id, nome, telefone, endereco) VALUES (?, ?, ?, ?)',
        [whatsappId, nome, telefone, endereco]
      );
      res.json({ success: true, message: 'Cliente cadastrado com sucesso!' });
    }
  } catch (error) {
    console.error('Erro ao salvar cliente:', error);
    res.status(500).json({ error: 'Erro ao salvar cliente' });
  }
});

// Endpoint para salvar configurações de personalização
app.post('/api/custom-settings', async (req, res) => {
  try {
    const settings = req.body;
    
    // Salvar configurações em um arquivo JSON
    const settingsPath = path.join(__dirname, 'custom-settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Configurações salvas com sucesso!' 
    });
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

// Endpoint para obter configurações de personalização
app.get('/api/custom-settings', (req, res) => {
  try {
    const settingsPath = path.join(__dirname, 'custom-settings.json');
    
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      res.json(settings);
    } else {
      // Retornar configurações padrão
      res.json({
        restaurantName: 'Brutus Burger',
        contact: '(42) 9 99830-2047',
        primaryColor: '#27ae60',
        secondaryColor: '#f39c12',
        backgroundColor: '#121212',
        pixKey: '',
        pixName: '',
        logo: null,
        theme: 'dark'
      });
    }
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    res.status(500).json({ error: 'Erro ao carregar configurações' });
  }
});

// Endpoint para atualizar produto com imagem (URL)
app.post('/api/produtos/:id/imagem', async (req, res) => {
  try {
    const { id } = req.params;
    const { imagem } = req.body;
    
    // Atualizar produto com a URL da imagem
    await db.run(
      'UPDATE produtos SET imagem = ? WHERE id = ?',
      [imagem, id]
    );
    
    res.json({ 
      success: true, 
      message: 'Imagem atualizada com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao atualizar imagem:', error);
    res.status(500).json({ error: 'Erro ao atualizar imagem' });
  }
});

// Endpoint para atualizar dados do produto (nome, descricao, preco, categoria)
app.put('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, preco, categoria } = req.body;
    
    // Atualizar produto com os novos dados
    await db.run(
      'UPDATE produtos SET nome = ?, descricao = ?, preco = ?, categoria = ? WHERE id = ?',
      [nome, descricao, preco, categoria, id]
    );
    
    res.json({ 
      success: true, 
      message: 'Produto atualizado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// Endpoint para excluir produto
app.delete('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o produto existe
    const produto = await db.get('SELECT * FROM produtos WHERE id = ?', [id]);
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Excluir o produto
    await db.run('DELETE FROM produtos WHERE id = ?', [id]);
    
    res.json({ 
      success: true, 
      message: 'Produto excluído com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ error: 'Erro ao excluir produto' });
  }
});

// Endpoint para criar novo produto
app.post('/api/produtos', async (req, res) => {
  try {
    const { nome, descricao, preco, categoria, imagem } = req.body;
    
    // Validar campos obrigatórios
    if (!nome || !preco || !categoria) {
      return res.status(400).json({ error: 'Nome, preço e categoria são obrigatórios' });
    }
    
    // Inserir novo produto
    const result = await db.run(
      'INSERT INTO produtos (nome, descricao, preco, categoria, imagem) VALUES (?, ?, ?, ?, ?)',
      [nome, descricao || '', preco, categoria, imagem || null]
    );
    
    const novoProduto = {
      id: result.lastID,
      nome,
      descricao: descricao || '',
      preco,
      categoria,
      imagem: imagem || null
    };
    
    res.status(201).json({ 
      success: true, 
      message: 'Produto criado com sucesso!',
      produto: novoProduto
    });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// Endpoint para upload de imagem
app.post('/api/produtos/:id/upload', upload.single('imagem'), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }
    
    // Caminho relativo para servir a imagem
    const imagePath = `/uploads/${req.file.filename}`;
    
    // Atualizar produto com o caminho da imagem
    await db.run(
      'UPDATE produtos SET imagem = ? WHERE id = ?',
      [imagePath, id]
    );
    
    res.json({ 
      success: true, 
      imagePath: imagePath,
      message: 'Imagem atualizada com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
  }
});

// Endpoint para atualizar status do pedido
app.put('/api/pedidos/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Verificar se o pedido existe
    const pedido = await db.get('SELECT * FROM pedidos WHERE id = ?', [id]);
    
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    // Atualizar status do pedido
    await db.run('UPDATE pedidos SET status = ? WHERE id = ?', [status, id]);
    
    res.json({ 
      success: true, 
      message: 'Status do pedido atualizado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    res.status(500).json({ error: 'Erro ao atualizar status do pedido' });
  }
});

// Endpoint para excluir pedido
app.delete('/api/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o pedido existe
    const pedido = await db.get('SELECT * FROM pedidos WHERE id = ?', [id]);
    
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    // Excluir itens do pedido
    await db.run('DELETE FROM pedido_itens WHERE pedido_id = ?', [id]);
    
    // Excluir o pedido
    await db.run('DELETE FROM pedidos WHERE id = ?', [id]);
    
    res.json({ 
      success: true, 
      message: 'Pedido excluído com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao excluir pedido:', error);
    res.status(500).json({ error: 'Erro ao excluir pedido' });
  }
});

// Inicialização do banco e servidor
async function startServer() {
  try {
    db = await open({
      filename: path.join(__dirname, 'db.sqlite'),
      driver: sqlite3.Database
    });
    
    // Criar tabelas
    await db.run(`CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      descricao TEXT,
      preco REAL,
      imagem TEXT,
      categoria TEXT
    )`);
    
    await db.run(`CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_nome TEXT,
      cliente_telefone TEXT,
      cliente_endereco TEXT,
      forma_pagamento TEXT,
      total REAL,
      distancia REAL,
      valor_entrega REAL,
      coordenadas_cliente TEXT,
      data DATETIME,
      status TEXT DEFAULT 'pending'
    )`);
    
    // Adicionar colunas para entrega se não existirem
    try {
      await db.run(`ALTER TABLE pedidos ADD COLUMN distancia REAL`);
    } catch (e) {
      // Coluna já existe, ignorar erro
    }
    
    try {
      await db.run(`ALTER TABLE pedidos ADD COLUMN valor_entrega REAL`);
    } catch (e) {
      // Coluna já existe, ignorar erro
    }
    
    try {
      await db.run(`ALTER TABLE pedidos ADD COLUMN coordenadas_cliente TEXT`);
    } catch (e) {
      // Coluna já existe, ignorar erro
    }
    
    await db.run(`CREATE TABLE IF NOT EXISTS pedido_itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER,
      produto_id INTEGER,
      quantidade INTEGER,
      preco_unitario REAL
    )`);
    
    // Criar tabela de clientes para armazenar informações persistentes
    await db.run(`CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      whatsapp_id TEXT UNIQUE,
      nome TEXT,
      telefone TEXT,
      endereco TEXT,
      data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Verificar se há produtos, se não houver, popular o banco
    const produtosExistentes = await db.get('SELECT COUNT(*) as count FROM produtos');
    if (produtosExistentes.count === 0) {
      await popularBancoDeDados();
    }
    
    // Inicializar serviços
    whatsappService = new WhatsAppService();
    whatsappService.initialize();
    
    deliveryService = new DeliveryService();
    
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error);
  }
}

// Função para popular o banco de dados com o cardápio completo
async function popularBancoDeDados() {
  try {
    // Ler o arquivo cardapio.json
    const cardapioPath = path.join(__dirname, '../cardapio.json');
    const cardapioData = fs.readFileSync(cardapioPath, 'utf8');
    const cardapio = JSON.parse(cardapioData);
    
    // Inserir produtos por categoria
    for (const categoria of cardapio.categorias) {
      for (const item of categoria.itens) {
        await db.run(
          'INSERT INTO produtos (nome, descricao, preco, categoria) VALUES (?, ?, ?, ?)',
          [item.nome, item.descricao || '', item.preco, categoria.nome]
        );
      }
    }
    
    console.log('Banco de dados populado com sucesso!');
  } catch (error) {
    console.error('Erro ao popular o banco de dados:', error);
  }
}

startServer();