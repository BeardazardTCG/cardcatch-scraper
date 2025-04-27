const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
app.use(express.json());

// --- Get Average eBay Sold Price
app.get('/api/getCardPrice', async (req, res) => {
  try {
    const query = req.query.query;
    const url = `https://www.ebay.co.uk/sch/i.html?_nkw=${encodeURIComponent(query)}&_sop=13&LH_Complete=1&LH_Sold=1`;

    const response = await axios.get(url, {
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
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      res.json({ averagePrice: parseFloat(avgPrice.toFixed(2)) });
    } else {
      res.json({ averagePrice: null });
    }
  } catch (error) {
    console.error('Fetch Error:', error);
    res.status(500).json({ averagePrice: null });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ CardCatch running on port ${PORT}`));
