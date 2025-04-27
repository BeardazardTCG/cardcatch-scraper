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

//
