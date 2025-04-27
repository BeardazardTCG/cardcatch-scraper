// --- 2. Scraper (Simpler, no aggressive filters) ---
async function scrapeSoldPrices(cardName, setName, cardNumber) {
  try {
    const ebayUrl = buildEbaySearchUrl(cardName, setName, cardNumber);
    const response = await axios.get(ebayUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const $ = cheerio.load(response.data);
    let prices = [];

    $('li.s-item').each((_, el) => {
      const title = $(el).find('h3.s-item__title').text().toLowerCase();
      const rawPrice = $(el).find('span.s-item__price').first().text()
                          .replace('£','').replace(',','').trim();
      const price = parseFloat(rawPrice);
      
      if (!title || isNaN(price)) {
        return; // Skip junk
      }

      // ✅ No aggressive filters — allow anything with a valid title and price
      prices.push(price);
    });

    if (prices.length === 0) {
      return { averagePrice: null, medianPrice: null };
    }

    // Calculate average
    const averagePrice = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);

    // Calculate median
    const sortedPrices = prices.sort((a, b) => a - b);
    const middle = Math.floor(sortedPrices.length / 2);
    const medianPrice = (sortedPrices.length % 2 !== 0)
      ? sortedPrices[middle]
      : ((sortedPrices[middle - 1] + sortedPrices[middle]) / 2).toFixed(2);

    return { averagePrice, medianPrice };
  } catch (error) {
    console.error("Scraping Error:", error.message);
    return { averagePrice: null, medianPrice: null };
  }
}
