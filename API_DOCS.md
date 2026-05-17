# 🎵 YouTube Search API

API Node.js para buscar músicas no YouTube sem precisar de chave de API.

## Quick Start

### 1. Instala dependências
```bash
npm install
```

### 2. Roda localmente
```bash
npm start
```

Server vai rodar em `http://localhost:5000`

### 3. Testa a API

**Health check:**
```bash
curl http://localhost:5000/health
```

**Buscar música:**
```bash
curl "http://localhost:5000/api/search?q=coldplay&limit=5"
```

## Endpoints

### `GET /api/search?q=query&limit=10`

Busca vídeos no YouTube por query.

**Parâmetros:**
- `q` (obrigatório): Termo de busca (ex: "coldplay", "música eletrônica")
- `limit` (opcional): Quantidade de resultados (default: 10, máximo: 50)

**Resposta:**
```json
{
  "query": "coldplay",
  "total": 5,
  "results": [
    {
      "id": "dvgZkm-dYWs",
      "title": "Coldplay - Fix You [Official Video]",
      "duration": "4:55",
      "url": "https://www.youtube.com/watch?v=dvgZkm-dYWs",
      "thumbnail": "https://...",
      "views": "1.5B",
      "channel": "Coldplay",
      "description": "..."
    }
  ]
}
```

### `GET /api/search/trending`

Dica para buscar trending.

---

## Deploy na VPS (depois)

Quando quiser subir na VPS `162.55.160.206`:

1. Clone o repo
2. `npm install`
3. Crie `.env` com `PORT=3001` (ou outra porta)
4. `pm2 start src/server.js --name youtube-search`
5. Configure nginx pra rotear `/api/search` → `http://localhost:3001`

---

## Tecnologias

- **Express.js** - Framework web
- **youtube-search-without-api-key** - Busca no YouTube sem API key
- **CORS** - Cross-origin support
- **dotenv** - Variáveis de ambiente

## Notas

- Sem necessidade de chave de API do YouTube
- Rate limiting: respeita limites do YouTube automaticamente
- Máximo 50 resultados por busca (proteção contra abuse)

---

**Made with 🎸 by Claude Haiku 4.5**
