const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

app.use(cors());

app.get('/api/getCardPrice', async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameters.' });
  }

  try {
    const url = `https://www.ebay.co.uk/sch/i.html?_nkw=${encodeURIComponent(query)}&_sop=12&LH_Sold=1&LH_Complete=1&LH_BIN=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = await response.text();

    const matches = [...html.matchAll(/£(\d+\.\d{2})/g)].map(m => parseFloat(m[1]));
    if (matches.length === 0) {
      return res.json({ medianPrice: null });
    }

    matches.sort((a, b) => a - b);
    const medianPrice = matches[Math.floor(matches.length / 2)];
    res.json({ medianPrice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Scraping failed' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ CardCatch scraper running on port ${PORT}`));
