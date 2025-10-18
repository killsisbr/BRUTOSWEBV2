// Script para popular o banco de dados SQLite3 com o cardápio completo
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function popular() {
  try {
    const db = await open({
      filename: path.join(__dirname, 'db.sqlite'),
      driver: sqlite3.Database
    });
    
    // Criar tabela de produtos
    await db.run(`CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      descricao TEXT,
      preco REAL,
      imagem TEXT,
      categoria TEXT
    )`);
    
    // Criar tabelas para pedidos
    await db.run(`CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_nome TEXT,
      cliente_telefone TEXT,
      cliente_endereco TEXT,
      forma_pagamento TEXT,
      total REAL,
      data DATETIME
    )`);
    
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
    
    // Limpar produtos existentes
    await db.run(`DELETE FROM produtos`);
    
    // Ler o arquivo cardapio.json
    const cardapioPath = path.join(__dirname, '../cardapio.json');
    const cardapioData = fs.readFileSync(cardapioPath, 'utf8');
    const cardapio = JSON.parse(cardapioData);
    
    // Contador de produtos inseridos
    let produtosInseridos = 0;
    
    // Inserir produtos por categoria
    for (const categoria of cardapio.categorias) {
      for (const item of categoria.itens) {
        await db.run(
          'INSERT INTO produtos (nome, descricao, preco, categoria) VALUES (?, ?, ?, ?)',
          [item.nome, item.descricao || '', item.preco, categoria.nome]
        );
        produtosInseridos++;
      }
    }
    
    await db.close();
    console.log(`${produtosInseridos} produtos inseridos com sucesso!`);
  } catch (error) {
    console.error('Erro ao popular o banco de dados:', error);
  }
}

popular();