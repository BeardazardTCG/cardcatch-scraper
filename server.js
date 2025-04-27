// --- CardCatch v2 Server (Simple, Median First, Stable) ---

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
app.use(express.json());

// --- 1. URL Builder ---
function buildEbaySearchUrl(cardName, setName, cardNumber) {
  const baseUrl = 'https://www.ebay.co.uk/sch/i.html';
  const searchQuery = `${cardName} ${setName} ${cardNumber}`.trim();
  const params = new URLSearchParams({
    _nkw: searchQuery,
    _sacat: '183454',          // CCG Individual Cards
    LH_Sold: '1',              // Sold Listings
    LH_Complete: '1',          // Completed Listings
    LH_BIN: '1',               // Buy It Now
    LH_PrefLoc: '1',           // UK sellers
    _ipg: '120',               // 120 items per page
    _sop: '13',                // Ended Recently
    _dmd: '2'                  // Gallery View
  });
  return `${baseUrl}?${params.toString()}`;
}

// --- 2. Scraper (Simple with Median First) ---
async function scrapeSoldPrices(cardName, setName, cardNumber) {
  try {
    const ebayUrl = buildEbaySearchUrl(cardName, setName, cardNumber);
    const response = await axios.get(ebayUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const $ = cheerio.load(response.data);
    let prices = [];

    $('li.s-item').each((_, el) => {
      const title = $(el).find('h3.s-item__title').text();
      const priceText = $(el).find('span.s-item__price').first().text()
                             .replace('£', '').replace(',', '').trim();
      const price = parseFloat(priceText);

      if (!title || isNaN(price)) {
        return; // skip
      }

      prices.push(price);
    });

    if (prices.length === 0) {
      return { averagePrice: null, medianPrice: null };
    }

    const sortedPrices = prices.sort((a, b) => a - b);
    const middle = Math.floor(sortedPrices.length / 2);
    const medianPrice = (sortedPrices.length % 2 !== 0)
      ? sortedPrices[middle]
      : ((sortedPrices[middle - 1] + sortedPrices[middle]) / 2);

    const averagePrice = (prices.reduce((a, b) => a + b, 0) / prices.length);

    return { 
      averagePrice: parseFloat(averagePrice.toFixed(2)), 
      medianPrice: parseFloat(medianPrice.toFixed(2)) 
    };
  } catch (error) {
    console.error("Scraping Error:", error.message);
    return { averagePrice: null, medianPrice: null };
  }
}

// --- 3. Root Health Check ---
app.get('/', (req, res) => {
  res.send('✅ CardCatch Server is Alive!');
});

// --- 4. API Endpoint ---
app.get('/api/getCardPrice', async (req, res) => {
  const { cardName, setName, cardNumber } = req.query;
  if (!cardName || !setName || !cardNumber) {
    return res.status(400).json({ error: 'Missing query parameters.' });
  }
  const result = await scrapeSoldPrices(cardName, setName, cardNumber);
  res.json(result);
});

// --- 5. Start Server ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ CardCatch server running on port ${PORT}`);
});
