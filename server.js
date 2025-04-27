const express = require('express');
const app = express();
const fetch = require('node-fetch');
app.use(express.json());

// --- EXISTING single query endpoint
app.get('/api/getCardPrice', async (req, res) => {
  const query = req.query.query;
  const url = `https://api.ebay.com/.../findCompletedItems?q=${encodeURIComponent(query)}`; // Example placeholder
  const response = await fetch(url);
  const data = await response.json();
  if (data && data.averagePrice !== undefined) {
    res.json({ averagePrice: data.averagePrice });
  } else {
    res.json({ averagePrice: null });
  }
});

// --- NEW BATCH endpoint
app.post('/api/getCardPrices', async (req, res) => {
  try {
    const queries = req.body.queries;
    if (!queries || !Array.isArray(queries)) {
      return res.status(400).json({ error: 'Invalid queries array' });
    }

    const results = [];

    for (const query of queries) {
      const url = `https://api.ebay.com/.../findCompletedItems?q=${encodeURIComponent(query)}`; // Same logic
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.averagePrice !== undefined) {
        results.push({ query: query, averagePrice: data.averagePrice });
      } else {
        results.push({ query: query, averagePrice: null });
      }

      await new Promise(resolve => setTimeout(resolve, 1200)); // (1.2s safety delay between hits)
    }

    res.json({ results: results });
  } catch (error) {
    console.error('Batch Fetch Error:', error);
    res.status(500).json({ error: 'Batch Fetch Failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
