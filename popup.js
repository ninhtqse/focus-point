// Function to format currency as VND
function formatVND(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatCurrency(amount) {
    return `$${parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
}

function formatCurrencyVND(amount) {
    return `${parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')} ₫`;
}

async function scrapeWeather() {
    const url = 'https://www.accuweather.com/vi/vn/hanoi/353412/daily-weather-forecast/353412';

    try {
        // Fetch the page content
        const response = await fetch(url);
        const body = await response.text();

        // Parse the HTML content using DOMParser
        const parser = new DOMParser();
        const doc = parser.parseFromString(body, 'text/html');

        // Get the first three daily forecast cards
        const forecastCards = doc.querySelectorAll('.daily-forecast-card');
        const halfDayCards = doc.querySelectorAll('.half-day-card-content');

        // If there are at least 3 forecast cards, extract data for them
        if (forecastCards.length >= 3) {
            const weatherData = [];

            for (let i = 0; i < 3; i++) {
                const dateTempElement = forecastCards[i].querySelector('.info .date .dow');
                const subDateTempElement = forecastCards[i].querySelector('.info .date .sub');
                const rainTempElement = forecastCards[i].querySelector('.precip');
                const statusTempElement = halfDayCards[i].querySelector('.phrase');

                const highTempElement = forecastCards[i].querySelector('.info .temp .high');
                const lowTempElement = forecastCards[i].querySelector('.info .temp .low');

                if (highTempElement && lowTempElement) {
                    const highTemp = highTempElement.textContent.trim();
                    const lowTemp = lowTempElement.textContent.trim();

                    const dow = dateTempElement.textContent.trim();
                    const sub = subDateTempElement.textContent.trim();

                    document.getElementById(`weather-day-${i + 1}`).textContent = `${dow} (${sub})`;
                    document.getElementById(`weather-temp-${i + 1}`).textContent = `${highTemp}${lowTemp}`;
                    document.getElementById(`weather-rain-${i + 1}`).textContent = rainTempElement.textContent.trim();
                    document.getElementById(`weather-status-${i + 1}`).textContent = statusTempElement.textContent.trim();
                } else {
                    weatherData.push(`Day ${i + 1} - Data not available`);
                }
            }

            return weatherData.join('\n');
        } else {
            return 'Not enough forecast data available.';
        }
    } catch (error) {
        console.error('Error scraping weather data:', error);
        return 'Error scraping weather data';
    }
}

// Fetch Gold Price from SJC (Buy and Sell)
async function fetchGoldPriceVN() {
    const url = 'https://sjc.com.vn/GoldPrice/Services/PriceService.ashx';

    const headers = {
        'Accept': '*/*',
        'Accept-Language': 'en,vi;q=0.9,en-US;q=0.8,ja;q=0.7,hy;q=0.6',
        'Content-Length': '0',
        'Origin': 'https://sjc.com.vn',
        'Priority': 'u=1, i',
        'Referer': 'https://sjc.com.vn/',
        'Sec-CH-UA': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'Sec-CH-UA-Mobile': '?0',
        'Sec-CH-UA-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers
        });
        const data = await response.json();

        if (data && data.data) {
            const buyPrice = formatVND(data.data[3].BuyValue);  // Assuming index 3 is Buy Price
            const sellPrice = formatVND(data.data[3].SellValue);  // Assuming index 3 is Sell Price
            return { buyPrice, sellPrice };
        } else {
            console.error('N/A');
            return { buyPrice: 'N/A', sellPrice: 'N/A' };
        }
    } catch (error) {
        console.error('Error fetching gold price:', error);
        return { buyPrice: 'Error', sellPrice: 'Error' };
    }
}

async function fetchSilverPriceVN() {
  try {
        const url = 'https://api-utility.ninhtqse.site/sliver';

        const response = await fetch(url);
        const data = await response.json();

        // The price is in the `price` field of the response

        return [`${data.buy} ₫`, `${data.sell} ₫`];

  } catch (err) {
    return ['-', '-'];
  }
}

// Fetch Bitcoin Price from Binance API (Spot Market)
async function fetchBitcoinPrice() {
    try {
        const response = await fetch(
            'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'
        );
        const data = await response.json();
        
        // The price is in the `price` field of the response
        return formatCurrency(data.price);
    } catch (error) {
        console.error('Error fetching Bitcoin price from Binance:', error);
        return 'Error';
    }
}

// Fetch Ethereum Price from Binance API (Spot Market)
async function fetchEthereumPrice() {
    try {
        const response = await fetch(
            'https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT'
        );
        const data = await response.json();
        
        // The price is in the `price` field of the response
        return formatCurrency(data.price);
    } catch (error) {
        console.error('Error fetching Ethereum price from Binance:', error);
        return 'Error';
    }
}

async function fetchP2PPrice()
{
    try {
        const url = 'https://api-utility.ninhtqse.site/p2p';

        const response = await fetch(url);
        const data = await response.json();

        // The price is in the `price` field of the response
        return data.price;
    } catch (error) {
        console.error('Error fetching Ethereum price from Binance:', error);
        return 'Error';
    }
}

// Update all prices
async function updatePoints() {

    const goldBuyPriceElement = document.getElementById('gold-buy-price');
    const goldSellPriceElement = document.getElementById('gold-sell-price');
    const bitcoinPriceElement = document.getElementById('bitcoin-price-value');
    const ethereumPriceElement = document.getElementById('ethereum-price-value');
    const p2pPriceElement = document.getElementById('p2p-price-value');

    const silverBuyPricesElement = document.getElementById('silver-buy-price');
    const silverSellPricesElement = document.getElementById('silver-sell-price');

    // Set loading text while fetching
    goldBuyPriceElement.textContent = 'Loading...';
    goldSellPriceElement.textContent = 'Loading...';
    bitcoinPriceElement.textContent = 'Loading...';
    ethereumPriceElement.textContent = 'Loading...';
    p2pPriceElement.textContent = 'Loading...';

    silverBuyPricesElement.textContent = 'Loading...';
    silverSellPricesElement.textContent = 'Loading...';

    // Fetch the data
    const goldPrices = await fetchGoldPriceVN();
    const bitcoinPrice = await fetchBitcoinPrice();
    const ethereumPrice = await fetchEthereumPrice();
    const p2pPrice = await fetchP2PPrice();
    await scrapeWeather();

    [silverBuyPricesElement.textContent, silverSellPricesElement.textContent] = await fetchSilverPriceVN();

    // Update the DOM with fetched values
    goldBuyPriceElement.textContent = goldPrices.buyPrice;
    goldSellPriceElement.textContent = goldPrices.sellPrice;
    bitcoinPriceElement.textContent = bitcoinPrice;  // Display Bitcoin price in USD
    ethereumPriceElement.textContent = ethereumPrice;  // Display Ethereum price in USD
    p2pPriceElement.textContent = formatCurrencyVND(p2pPrice);  // Display Ethereum price in USD
}

// Initial price update
updatePoints();

// Update prices every 60 seconds
setInterval(updatePoints, 60000);
