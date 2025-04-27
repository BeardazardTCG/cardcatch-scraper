const axios = require('axios');
const cheerio = require('cheerio');

// --- CardCatch v2 Smart Scraper ---
// Scrape sold prices from eBay, block slabs/lots, use median pricing

async function scrapeSoldPrices(cardName, setName, cardNumber) {
  try {
    const ebayUrl = buildEbaySearchUrl(cardName, setName, cardNumber);
    const response = await axios.get(ebayUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const $ = cheerio.load(response.data);
    let prices = [];

    // Define BAD keywords (case insensitive)
    const badWords = ["PSA", "BGS", "CGC", "Slab", "Graded", "Lot", "Set", "Binder", "Bundle", "Collection"];

    $('li.s-item').each((i, el) => {
      const title = $(el).find('h3.s-item__title').text().toLowerCase();
      const priceText = $(el).find('span.s-item__price').first().text().replace('£', '').replace(',', '').trim();
      const price = parseFloat(priceText);

      if (!title || isNaN(price)) {
        return; // skip if missing title or bad price
      }

      // Check if title contains any bad keywords
      const isBadListing = badWords.some(badWord => title.includes(badWord.toLowerCase()));

      if (!isBadListing) {
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
