// --- CardCatch v2 Server (with /api/getCardPrice) ---

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
    _sacat: '183454',
    LH_Sold: '1',
    LH_Complete: '1',
    LH_BIN: '1',
    LH_PrefLoc: '1',
    _ipg: '120',
    _sop: '13',
    _dmd: '2'
  });
  return `${baseUrl}?${params.toString()}`;
}

// --- 2. Smart Scraper ---
async function scrapeSoldPrices(cardName, setName, cardNumber) {
  try {
    const ebayUrl = buildEbaySearchUrl(cardName, setName, cardNumber);
    const response = await axios.get(ebayUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const $ = cheerio.load(response.data);
    const badWords = ["psa","bgs","cgc","slab","graded","lot","set","binder","bundle","collection"];
    let prices = [];

    $('li.s-item').each((_, el) => {
      const title = $(el).find('h3.s-item__title').text().toLowerCase();
      const rawPrice = $(el).find('span.s-item__price').first().text()
                          .replace('£','').replace(',','').trim();
      const price = parseFloat(rawPrice);
      if (!title || isNaN(price)) return;
      if (badWords.some(w => title.includes(w))) return;
      prices.push(price);
    });

    if (prices.length === 0) {
      return { averagePrice: null, medianPrice: null };
    }

    // average
    const avg = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
    // median
    prices.sort((a, b) => a - b);
    const mid = Math.floor(prices.length / 2);
    const med = (prices.length % 2 !== 0)
      ? prices[mid]
      : ((prices[mid - 1] + prices[mid]) / 2).toFixed(2);

    return { averagePrice: avg, medianPrice: med };
  } catch (err) {
    console.error("Scraping Error:", err.message);
    return { averagePrice: null, medianPrice: null };
  }
}

// --- 3. Health-Check Route ---
app.get('/', (req, res) => {
  res.send('✅ CardCatch Server is Alive!');
});

// --- 4. API Endpoint for Sheets ---
app.get('/api/getCardPrice', async (req, res) => {
  const { cardName, setName, cardNumber } = req.query;
  if (!cardName || !setName || !cardNumber) {
    return res.status(400).json({ error: 'Missing query parameter: cardName, setName, and cardNumber are required.' });
  }
  const result = await scrapeSoldPrices(cardName, setName, cardNumber);
  res.json(result);
});

// --- 5. Server Listen ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ CardCatch server running on port ${PORT}`);
});
