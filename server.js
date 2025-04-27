// --- CardCatch v2.1 Server (Stable Scraper, Median Priority) ---

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

// --- 2. Scraper (Smarter Version) ---
async function scrapeSoldPrices(cardName, setName, cardNumber) {
  try {
    const ebayUrl = buildEbaySearchUrl(cardName, setName, cardNumber);
    const response = await axios.get(ebayUrl, {
      headers: { 'User-Agent': 'Mozilla/
