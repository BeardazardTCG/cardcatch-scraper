const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

async function fetchCardData(query) {
  try {
    const formattedQuery = encodeURIComponent(query);
    const ebayURL = `https://www.ebay.co.uk/sch/i.html?_nkw=${formattedQuery}&LH_Sold=1&LH_Complete=1&rt=nc`;

    const { data } = await axios.get(ebayURL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(data);
    const items = $('li.s-item');

    let prices = [];

    items.each((index, element) => {
      const title = $(element).find('.s-item__title').text();
      const priceText = $(element).find('.s-item__price').first().text();
      const priceMatch = priceText.match(/£(\d+(\.\d{2})?)/);

      if (
        title.toLowerCase().includes(query.split(' ')[0].toLowerCase()) &&
        title.includes(query.split(' ')[1]) &&
        !title.toLowerCase().includes('psa') &&
        !title.toLowerCase().includes('cgc') &&
        !title.toLowerCase().includes('proxy') &&
        !title.toLowerCase().includes('lot') &&
        !title.toLowerCase().includes('japanese') &&
        priceMatch
      ) {
        prices.push(parseFloat(priceMatch[1]));
      }
    });

    const averagePrice = prices.length > 0
      ? (prices.reduce((acc, val) => acc + val, 0) / prices.length).toFixed(2)
      : 0;

    return {
      card: query,
      averagePrice: Number(averagePrice),
      totalSales: prices.length
    };

  } catch (error) {
    console.error('Error fetching data:', error);
    return { error: 'Failed to fetch card data' };
  }
}

app.get('/api/getCardPrice', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  const result = await fetchCardData(query);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

