const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
app.use(express.json());

// --- API Route: Get Card Price based on Full Query ---
app.get('/api/getCardPrice', async (req, res) => {
  try {
    const query = req.query.query;

    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter.' });
    }

    const ebayUrl = `https://www.ebay.co.uk/sch/i.html?_nkw=${encodeURIComponent(query)}&_sop=13&LH_Complete=1&LH_Sold=1&LH_BIN=1&rt=nc&_ipg=120&_dcat=183454&LH_PrefLoc=1`;

    const response = await axios.get(ebayUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const $ = cheerio.load(response.data);
    let prices = [];

    $('span.s-item__price').each((i, el) => {
      let priceText = $(el).text().replace('£', '').replace(',', '').trim();
      let price = parseFloat(priceText);
      if (!isNaN(price)) {
        prices.push(price);
      }
    });

    if (prices.length > 0) {
      const sorted = prices.sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const medianPrice = sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;

      res.json({ medianPrice: parseFloat(medianPrice.toFixed(2)) });
    } else {
      res.json({ medianPrice: null });
    }

  } catch (error) {
    console.error('Scraping Error:', error);
    res.status(500).json({ medianPrice: null });
  }
});

// --- Start Server ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ CardCatch server running on port ${PORT}`));
