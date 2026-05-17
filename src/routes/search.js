const express = require('express');
const search = require('yt-search');

const router = express.Router();

/**
 * GET /api/search?q=query&limit=10
 * Busca músicas no YouTube
 */
router.get('/', async (req, res) => {
  try {
    const { q, limit } = req.query;

    // Validação
    if (!q) {
      return res.status(400).json({
        error: 'Parâmetro "q" (query) é obrigatório',
        example: '/api/search?q=coldplay&limit=5'
      });
    }

    const searchLimit = Math.min(parseInt(limit) || 10, 50); // Máximo 50

    // Busca
    const results = await search(q);

    // Formata resposta
    const formattedResults = results.videos.slice(0, searchLimit).map((video) => ({
      id: video.videoId,
      title: video.title,
      duration: video.duration || 'N/A',
      url: video.url,
      thumbnail: video.thumbnail || null,
      views: video.views || 'N/A',
      channel: video.author?.name || 'Unknown',
      description: video.description || ''
    }));

    res.json({
      query: q,
      total: formattedResults.length,
      results: formattedResults
    });
  } catch (error) {
    console.error('Erro na busca:', error);
    res.status(500).json({
      error: 'Erro ao buscar no YouTube',
      details: error.message
    });
  }
});

/**
 * GET /api/search/trending
 * (Placeholder para trending - YouTube Search não oferece isso sem API key)
 */
router.get('/trending', (req, res) => {
  res.json({
    message: 'Para trending, use busca geral com queries populares',
    suggestion: '/api/search?q=top%20hits%202024'
  });
});

module.exports = router;
