// --- CardCatch v2 Server ---

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
app.use(express.json());

// --- 1. URL Builder (Build perfect eBay search URL) ---
function buildEbaySearchUrl(cardName, setName, cardNumber) {
  const baseUrl = 'https://www.ebay.co.uk/sch/i.html';

  const searchQuery = `${cardName} ${setName} ${cardNumber}`.trim();

  const params = new URLSearchParams({
    _nkw: searchQuery,
    _sacat: '183454',          // CCG Individual Cards
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

// --- 2. Smart Scraper (Scrape sold prices, block slabs + lots) ---
async function scrapeSoldPrices(cardName, setName, cardNumber) {
  try {
    const ebayUrl = buildEbaySearchUrl(cardName, setName, cardNumber);
    const response = await axios.get(ebayUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const $ = cheerio.load(response.data);
    let prices = [];

    // Bad keywords to block (case insensitive)
    const badWords = ["PSA", "BGS", "CGC", "Slab", "Graded", "Lot", "Set", "Binder", "Bundle", "Collection"];

    $('li.s-item').each((i, el) => {
      const title = $(el).find('h3.s-item__title').text().toLowerCase();
      const priceText = $(el).find('span.s-item__price').first().text().replace('£', '').replace(',', '').trim();
      const price = parseFloat(priceText);

      if (!title || isNaN(price)) {
        return; // skip if missing title or bad price
      }

      const isBadListing = badWords.some(badWord => title.includes(badWord.toLowerCase()));

      if (!isBadListing) {
        prices.push(price)
