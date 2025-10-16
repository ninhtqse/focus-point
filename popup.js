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
    const url = 'https://giabac.vn/SilverInfo/FilterData';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      body: 'filterType=%23pills-profile'
    });

    const html = await res.text();

    // Parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Lấy giá mua/bán
    const buyEl = doc.querySelector('.text-red');
    const sellEl = doc.querySelector('.text-green');

    const buy = buyEl ? buyEl.textContent.trim() : '-';
    const sell = sellEl ? sellEl.textContent.trim() : '-';

    return [`${buy} ₫`, `${sell} ₫`];

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
        const url = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';

        const headers = {
            'Accept': '*/*',
            'Accept-Language': 'en,vi;q=0.9,en-US;q=0.8,ja;q=0.7,hy;q=0.6',
            'bnc-level': '0',
            'bnc-location': 'VN',
            'bnc-time-zone': 'Asia/Saigon',
            'bnc-uuid': 'c8f708bb-46f9-4a92-8a5b-bd666734cccb',
            'c2ctype': 'c2c_web',
            'clienttype': 'web',
            'content-type': 'application/json',
            'csrftoken': '50ba99d334f279b725c9b14fd802cfd3',
            'device-info': 'eyJzY3JlZW5fcmVzb2x1dGlvbiI6IjE5MjAsMTA4MCIsImF2YWlsYWJsZV9zY3JlZW5fcmVzb2x1dGlvbiI6IjE5MjAsMTAzMiIsInN5c3RlbV92ZXJzaW9uIjoiV2luZG93cyAxMCIsImJyYW5kX21vZGVsIjoidW5rbm93biIsInN5c3RlbV9sYW5nIjoiZW4iLCJ0aW1lem9uZSI6IkdNVCswNzowMCIsInRpbWV6b25lT2Zmc2V0IjotNDIwLCJ1c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzE0MS4wLjAuMCBTYWZhcmkvNTM3LjM2IiwibGlzdF9wbHVnaW4iOiJQREYgVmlld2VyLENocm9tZSBQREYgVmlld2VyLENocm9taXVtIFBERiBWaWV3ZXIsTWljcm9zb2Z0IEVkZ2UgUERGIFZpZXdlcixXZWJLaXQgYnVpbHQtaW4gUERGIiwiY2FudmFzX2NvZGUiOiI4ODgwZjFjOSIsIndlYmdsX3ZlbmRvciI6Ikdvb2dsZSBJbmMuIChOVklESUEpIiwid2ViZ2xfcmVuZGVyZXIiOiJBTkdMRSAoTlZJRElBLCBOVklESUEgR2VGb3JjZSBSVFggMzA2MCAoMHgwMDAwMjQ4NykgRGlyZWN0M0QxMSB2c181XzAgcHNfNV8wLCBEM0QxMSkiLCJhdWRpbyI6IjEyNC4wNDM0NzUyNzUxNjA3NCIsInBsYXRmb3JtIjoiV2luMzIiLCJ3ZWJfdGltZXpvbmUiOiJBc2lhL1NhaWdvbiIsImRldmljZV9uYW1lIjoiQ2hyb21lIFYxNDEuMC4wLjAgKFdpbmRvd3MpIiwiZmluZ2VycHJpbnQiOiIzZjBjNDNiY2RiYTc5OGYxMDU0YTljMDhiZjAyNjNkZiIsImRldmljZV9pZCI6IiIsInJlbGF0ZWRfZGV2aWNlX2lkcyI6IiJ9',
            'fvideo-id': '330b129978c3a266b37deeda4d009c581788726d',
            'fvideo-token': 'uXrGNpjgj6heGZ+6ZYt3uBMnDoiRLtMJCspEkkZoHd2ke1I6ZcNszV2qnklJL85OxyLZ26UPSWhJW887is1WuX3vU7LP9np9/pFjJ+KeMmKJn1JkqIW50QFG5/UuPuG8TOILcm2eTQdOsLz0uhomu29IF0md5b+uMb2CMM36DrtwiZ9Bvmm6Up59Fsg9RzLnI=28',
            'lang': 'vi',
            'origin': 'https://p2p.binance.com',
            'priority': 'u=1, i',
            'referer': 'https://p2p.binance.com/vi',
            'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
            'x-trace-id': 'c0fe085f-5a4f-4f3b-a9c1-c988d610a50b',
            'x-ui-request-trace': 'c0fe085f-5a4f-4f3b-a9c1-c988d610a50b',
            'Cookie': 'bnc-uuid=c8f708bb-46f9-4a92-8a5b-bd666734cccb; se_gd=VIRUgRwYQGSEAARcEUhFgZZUVHgoYBTUVoXFZVkB1JVUwGVNWV4T1; se_gsd=USc2LDNlIzEkFjsyNwMxNCo3Dw0QBANUVVxHU1JTVlJTDVNT1; BNC_FV_KEY=330b129978c3a266b37deeda4d009c581788726d; BNC-Location=VN; lang=vi; OptanonAlertBoxClosed=2025-07-21T13:57:41.684Z; _gcl_au=1.1.1642633081.1753106597; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%22425660311%22%2C%22first_id%22%3A%221982d44e80da91-04d450a0b18cad4-26011151-2073600-1982d44e80e1237%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%2C%22%24latest_referrer%22%3A%22%22%7D%2C%22identities%22%3A%22eyIkaWRlbnRpdHlfY29va2llX2lkIjoiMTk4MmQ0NGU4MGRhOTEtMDRkNDUwYTBiMThjYWQ0LTI2MDExMTUxLTIwNzM2MDAtMTk4MmQ0NGU4MGUxMjM3IiwiJGlkZW50aXR5X2xvZ2luX2lkIjoiNDI1NjYwMzExIn0%3D%22%2C%22history_login_id%22%3A%7B%22name%22%3A%22%24identity_login_id%22%2C%22value%22%3A%22425660311%22%7D%2C%22%24device_id%22%3A%221982d55ecbe1c0-046a7938f589068-26011151-2073600-1982d55ecbf980%22%7D; changeBasisTimeZone=; userPreferredCurrency=USD_USD; fiat-prefer-currency=VND; common_fiat=%7B%22fiat%22%3A%22VND%22%7D; _gid=GA1.2.313032872.1760534531; r20t=web.A9AF0AC96DE1CE6C3350C4DC74145884; r30t=1; cr00=792004694B75C9AF306BF5E9931557D5; d1og=web.425660311.D3F2F3A9561E07892DC6EF296C860C24; r2o1=web.425660311.CBC037F5A2EE150E1D094FE334C10D74; f30l=web.425660311.32055D4A1838F3117C3D0C3EAC6C2FC2; currentAccount=; logined=y; isAccountsLoggedIn=y; theme=dark; BNC_FV_KEY_T=101-qZsBnFCOi1ouPN6HDs9f0u8h7xc91iCLydnEgfKnMmrwoUhCCNZjpgb7NdzLi1XEpd3pg5u6Dxa2Ryf6pkPWKw%3D%3D-6VRgyZOxSuVUWzc0l38z9g%3D%3D-c9; BNC_FV_KEY_EXPIRE=1760643472342; p20t=web.425660311.FC0A7895395DCD37C2F11100FEAD384D; _uetsid=f4fffd40a9c911f0b22801d6a986e23c; _uetvid=75150da0663b11f08094931308f75f96; OptanonConsent=isGpcEnabled=0&datestamp=Thu+Oct+16+2025+20%3A50%3A04+GMT%2B0700+(Indochina+Time)&version=202506.1.0&browserGpcFlag=0&isIABGlobal=false&hosts=&consentId=4dfac43b-5c1d-4050-bb0c-3760ccf3715f&interactionCount=2&isAnonUser=1&landingPath=NotLandingPage&groups=C0001%3A1%2CC0003%3A1%2CC0004%3A1%2CC0002%3A1&AwaitingReconsent=false&intType=1&geolocation=VN%3BHN; _h_desk_key=727f55fa241e4bac8860c650edc54a8e; _ga_3WP50LGEEC=GS2.1.s1760621881$o7$g1$t1760622606$j57$l0$h0; _ga=GA1.1.1893335982.1753106262',
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                fiat: "VND",
                page: 1,
                rows: 10,
                tradeType: "BUY",
                asset: "USDT",
                countries: [],
                proMerchantAds: false,
                shieldMerchantAds: false,
                filterType: "tradable",
                periods: [],
                additionalKycVerifyFilter: 0,
                publisherType: "merchant",
                payTypes: [],
                classifies: [
                    "mass",
                    "profession",
                    "fiat_trade"
                ],
                tradedWith: false,
                followed: false,
                transAmount: 5000000
            })
        });
        const data = await response.json();

        // The price is in the `price` field of the response
        return data;
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
    p2pPriceElement.textContent = formatCurrencyVND(p2pPrice.data?.[1].adv.price);  // Display Ethereum price in USD
}

// Initial price update
updatePoints();

// Update prices every 60 seconds
setInterval(updatePoints, 60000);
