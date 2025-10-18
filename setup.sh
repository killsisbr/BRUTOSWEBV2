#!/bin/bash

# Script de setup para o projeto BrutusWeb em VPS
# Este script instala todas as dependências necessárias e configura o projeto

echo "=== Setup do Projeto BrutusWeb ==="
echo "Iniciando instalação do sistema de pedidos para restaurantes..."

# Verificar se o script está sendo executado como root
if [ "$EUID" -ne 0 ]; then
  echo "Por favor, execute este script como root ou com sudo"
  exit 1
fi

# Solicitar domínio para configuração do SSL
echo "Digite o domínio para configuração do SSL (ex: seu-dominio.com):"
read DOMINIO

# Verificar se o domínio foi fornecido
if [ -z "$DOMINIO" ]; then
  echo "Domínio não fornecido. Continuando sem configuração de SSL."
  CONFIGURE_SSL=false
else
  CONFIGURE_SSL=true
fi

# Atualizar o sistema
echo "Atualizando o sistema..."
apt update && apt upgrade -y

# Instalar dependências do sistema
echo "Instalando dependências do sistema..."
apt install -y curl wget gnupg software-properties-common

# Instalar Node.js (versão LTS)
echo "Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs

# Instalar PM2 globalmente
echo "Instalando PM2..."
npm install -g pm2

# Verificar versões instaladas
echo "Verificando versões instaladas..."
node --version
npm --version
pm2 --version

# Criar usuário para executar a aplicação (opcional, mas recomendado)
echo "Criando usuário para a aplicação..."
useradd -m -s /bin/bash brutusweb
usermod -aG sudo brutusweb

# Criar diretório para logs
mkdir -p /home/brutusweb/logs
chown brutusweb:brutusweb /home/brutusweb/logs

# Clonar o repositório (ou copiar os arquivos)
echo "Configurando o projeto..."
cd /home/brutusweb
mkdir -p /home/brutusweb/app
# Aqui você pode clonar o repositório ou copiar os arquivos
# git clone <seu-repositorio> /home/brutusweb/app
# OU
# cp -r /caminho/para/seu/projeto/* /home/brutusweb/app/

# Definir permissões
chown -R brutusweb:brutusweb /home/brutusweb/app

# Instalar dependências do projeto
echo "Instalando dependências do projeto..."
cd /home/brutusweb/app/server
sudo -u brutusweb npm install

# Popular o banco de dados
echo "Populando o banco de dados..."
sudo -u brutusweb node popular_db.js

# Configurar o serviço PM2
echo "Configurando PM2..."
sudo -u brutusweb pm2 start /home/brutusweb/app/ecosystem.config.js
sudo -u brutusweb pm2 save
env PATH=$PATH:/usr/bin pm2 startup systemd -u brutusweb --hp /home/brutusweb

# Configurar firewall (opcional)
echo "Configurando firewall..."
ufw allow 3005/tcp
if [ "$CONFIGURE_SSL" = true ]; then
  ufw allow 80/tcp
  ufw allow 443/tcp
fi
ufw --force enable

# Instalar e configurar Nginx como proxy reverso (opcional)
echo "Instalando Nginx..."
apt install -y nginx

# Configurar Nginx
if [ "$CONFIGURE_SSL" = true ]; then
  cat > /etc/nginx/sites-available/brutusweb << EOF
server {
    listen 80;
    server_name $DOMINIO;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name $DOMINIO;

    ssl_certificate /etc/letsencrypt/live/$DOMINIO/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMINIO/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
else
  cat > /etc/nginx/sites-available/brutusweb << EOF
server {
    listen 80;
    server_name $DOMINIO; # Substitua pelo seu domínio

    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
fi

# Habilitar o site
ln -s /etc/nginx/sites-available/brutusweb /etc/nginx/sites-enabled/
nginx -t

# Instalar e configurar Let's Encrypt (se solicitado)
if [ "$CONFIGURE_SSL" = true ]; then
  echo "Instalando Certbot para Let's Encrypt..."
  apt install -y certbot python3-certbot-nginx
  
  echo "Obtendo certificado SSL para $DOMINIO..."
  # Criar diretório para desafios do certbot
  mkdir -p /var/www/certbot
  chown www-data:www-data /var/www/certbot
  
  # Testar configuração do Nginx antes de obter o certificado
  systemctl restart nginx
  
  # Obter certificado usando o desafio HTTP
  certbot --nginx --non-interactive --agree-tos --email admin@$DOMINIO -d $DOMINIO
  
  # Configurar renovação automática
  echo "Configurando renovação automática do certificado..."
  crontab -l > mycron
  echo "0 12 * * * /usr/bin/certbot renew --quiet" >> mycron
  crontab mycron
  rm mycron
fi

systemctl restart nginx

# Mostrar status do serviço
echo "Verificando status do serviço..."
sudo -u brutusweb pm2 status

echo "=== Setup concluído com sucesso! ==="
if [ "$CONFIGURE_SSL" = true ]; then
  echo "O sistema está rodando na porta 3005"
  echo "Acesso via HTTPS: https://$DOMINIO"
  echo "Para verificar os logs: pm2 logs brutusweb"
else
  echo "O sistema está rodando na porta 3005"
  echo "Se você configurou o Nginx, o sistema também está acessível na porta 80"
  echo "Para verificar os logs: pm2 logs brutusweb"
fi