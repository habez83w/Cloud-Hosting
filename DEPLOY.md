# 🚀 Deploy na VPS 162.55.160.206

## Passo 1: Conectar na VPS

```bash
ssh -i ~/.ssh/id_ed25519 root@162.55.160.206
```

## Passo 2: Clone o repositório

```bash
cd /home/cloudpanel/apps
git clone https://github.com/habez83w/Cloud-Hosting.git youtube-search-api
cd youtube-search-api
```

## Passo 3: Instale as dependências

```bash
npm install --production
```

## Passo 4: Crie o arquivo .env na VPS

```bash
cat > .env << 'EOF'
PORT=3001
NODE_ENV=production
EOF
```

## Passo 5: Inicie com PM2

```bash
# Como root:
pm2 start src/server.js --name "youtube-search" --instances max

# Ou como cloudpanel (recomendado):
sudo -iu cloudpanel pm2 start /home/cloudpanel/apps/youtube-search-api/src/server.js --name "youtube-search"

# Salve a configuração
pm2 save
```

## Passo 6: Configure o nginx para rotear a API

SSH na VPS e edite o nginx config:

```bash
# Conecte na VPS
ssh root@162.55.160.206

# Edite o arquivo de config (ou crie um novo)
nano /etc/nginx/conf.d/youtube-search.conf
```

Cole isso (substitua `seu-dominio.com` pelo seu domínio):

```nginx
server {
    listen 80;
    server_name api.seu-dominio.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Salve e saia (`Ctrl+X`, depois `Y`, depois `Enter`)

## Passo 7: Teste o nginx e reinicie

```bash
# Testa se está ok
sudo nginx -t

# Reinicia
sudo systemctl restart nginx
```

## Passo 8: Teste a API

```bash
# Localmente na VPS:
curl http://localhost:3001/health

# De fora (se configurou o domínio):
curl https://api.seu-dominio.com/api/search?q=coldplay
```

---

## ✅ Pronto!

A API agora está:
- ✅ Rodando em `http://162.55.160.206:3001` (porta interna)
- ✅ Acessível via nginx em `http://api.seu-dominio.com` (ou IP:3001)
- ✅ Gerenciada por PM2 (reinicia automaticamente)
- ✅ Faz log em `/root/.pm2/logs/youtube-search-error.log`

## Monitoramento

```bash
# Ver status
sudo -iu cloudpanel pm2 list

# Ver logs em tempo real
sudo -iu cloudpanel pm2 logs youtube-search

# Restart se necessário
sudo -iu cloudpanel pm2 restart youtube-search
```

---

**Quando subir pra produção, use HTTPS (SSL certificate)**
