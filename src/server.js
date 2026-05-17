const express = require('express');
const cors = require('cors');
require('dotenv').config();

const searchRoutes = require('./routes/search');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/search', searchRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`🎵 API YouTube Search rodando em http://localhost:${PORT}`);
  console.log(`📍 Testa em: http://localhost:${PORT}/api/search?q=seu%20artista`);
});
