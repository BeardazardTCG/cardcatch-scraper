// --- CardCatch v2 Server ---

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
app.use(express.json());

// --- 1. URL Builder (Build correct eBay Search URL) ---
function buildEbaySearchUrl(cardName, setName, cardNumber) {
  const baseUrl = 'https://www.ebay.co.uk/sch/i.html';
  
  const searchQuery = `${cardName} ${setName} ${cardNumber}`.trim();

  const params = new URLSearchParams({
    _nkw: searchQuery,
    _sacat: '183454',          // Category: CCG Individual Cards
    LH_Sold: '1',              // Sold Listings Only
    LH_Complete: '1',          // Completed Listings
    LH_BIN: '1',               // Buy It Now Only
    LH_PrefLoc: '1',           // UK Sellers Only
    _ipg: '120',               // 120 items per page
    _sop: '13',                // Sort by Ended Recently
    _dmd: '2'                  // Gallery View
  });

  const fullUrl = `${baseUrl}?${params.toString()}`;
  return fullUrl;
}

// --- 2. Scrape Sold Prices from eBay ---
async function scrapeSoldPrices(cardName, setName, cardNumber) {
  try {
    const ebayUrl = buildEbaySearchUrl(cardName, setName, cardNumber);
    const response = await axios.get(ebayUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
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

    if (prices.length === 0) {
      return { averagePrice: null, medianPrice: null };
    }

    // Calculate average
    const averagePrice = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);

    // Calculate median
    const sortedPrices = prices.sort((a, b) => a - b);
    const middle = Math.floor(sortedPrices.length / 2);
    const medianPrice = (sortedPrices.length % 2 !== 0) ? 
      sortedPrices[middle] : 
      ((sortedPrices[middle - 1] + sortedPrices[middle]) / 2).toFixed(2);

    return { averagePrice, medianPrice };
  } catch (error) {
    console.error("Scraping Error:", error.message);
    return { averagePrice: null, medianPrice: null };
  }
}

scrapeSoldPrices("Charizard ex", "Obsidian Flames", "125/197").then(result => {
  console.log("Scrape Result:", result);
});


// --- 4. Standard Server Listen (not critical right now) ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ CardCatch server running on port ${PORT}`));
