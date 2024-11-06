const express = require("express");
const mysql = require("mysql2");
const fs = require("fs");
const cors = require("cors");
const NodeCache = require("node-cache");
const SmartAPI = require("smartapi-javascript").SmartAPI;
const speakeasy = require("speakeasy");
const axios = require("axios");
const app = express();

app.use(cors());
const cache = new NodeCache({ stdTTL: 6000 });

const smartConnect = new SmartAPI({
  api_key: "DzYEeNRh",
  // Add other required configurations here
});

function generateTOTP(secret) {
  return speakeasy.totp({
    secret: secret,
    encoding: "base32",
  });
}

const TOTP_SECRET = "TNJCTHJKR43DYABQCT2IE5SXEY";
let jwtToken = null;
let refreshToken = null;
let feedToken = null;

async function authenticateSmartAPI() {
  const totp = generateTOTP(TOTP_SECRET);

  try {
    const data = await smartConnect.generateSession("R58212645", "1331", totp);
    jwtToken = data.data.jwtToken;
    refreshToken = data.data.refreshToken;
    feedToken = data.data.feedToken;
    console.log(jwtToken);
    return data;
  } catch (err) {
    console.error("Error generating session:", err);
    throw err; // Rethrow the error to handle it elsewhere if needed
  }
}
// authenticateSmartAPI();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.get("/api/gainers-losers", async (req, res) => {
  try {
    console.log("Authenticating SmartAPI...");

    await authenticateSmartAPI(); // Ensure you are authenticated before making the request
    console.log("Authentication successful.");

    

    console.log("Fetching gainers data...");
    const gainersData = await smartConnect.gainersLosers({
      datatype: "PercOIGainers",
      expirytype: "NEAR",
    });
    console.log("Gainers data response:", gainersData);

    if (gainersData.status !== true) {
      throw new Error(
        "Failed to fetch gainers data: " +
          (gainersData.message || "Unknown error")
      );
    }

    // Adding a delay of 1 second (1000 milliseconds)
    await delay(1000);

    console.log("Re-authenticating SmartAPI before fetching losers...");
    await authenticateSmartAPI(); // Re-authenticate before making the losers request
    console.log("Re-authentication successful.");

    console.log("Fetching losers data...");
    const losersData = await smartConnect.gainersLosers({
      datatype: "PercOILosers",
      expirytype: "NEAR",
    });
    console.log("Losers data response:", losersData);

    if (losersData.status !== true) {
      throw new Error(
        "Failed to fetch losers data: " +
          (losersData.message || "Unknown error")
      );
    }

    await delay(1000);

    console.log("Re-authenticating SmartAPI before fetching percgainers...");
    await authenticateSmartAPI(); // Re-authenticate before making the losers request
    console.log("Re-authentication successful.");

    console.log("Fetching perc gainers data...");
    const percGainersData = await smartConnect.gainersLosers({
      datatype: "PercPriceGainers",
      expirytype: "NEAR",
    });
    console.log("PercGainers data response:", percGainersData);

    if (percGainersData.status !== true) {
      throw new Error(
        "Failed to fetch gainers data: " +
          (percGainersData.message || "Unknown error")
      );
    }

    await delay(1000);

    console.log("Re-authenticating SmartAPI before fetching perclosers...");
    await authenticateSmartAPI(); // Re-authenticate before making the losers request
    console.log("Re-authentication successful.");

    console.log("Fetching perc losers data...");
    const percLosersData = await smartConnect.gainersLosers({
      datatype: "PercPriceLosers",
      expirytype: "NEAR",
    });
    console.log("PercLosers data response:", percLosersData);

    if (percLosersData.status !== true) {
      throw new Error(
        "Failed to fetch losers data: " +
          (percLosersData.message || "Unknown error")
      );
    }

    res.json({
      gainers: gainersData,
      losers: losersData,
      percgainers: percGainersData,
      perclosers: percLosersData,
    });
  } catch (error) {
    console.error("Error fetching gainers and losers:", error.message);
    res
      .status(500)
      .json({ error: error.message || "Failed to fetch gainers and losers" });
  }
});

app.get("/api/getHoldings", async(req,res)=>{
  try{

    console.log("Authenticating SmartApi");
    await authenticateSmartAPI();
    console.log("Authentication successful.");

    try {
      const holdings = await smartConnect.getHolding();
      res.json(holdings);
      console.log("Holdings Data:", holdings);
    } catch (holdingErr) {
      console.error("Error fetching holdings data:", holdingErr);
    }

  }catch(error){
    console.error("Error fetching holding data:", error);
  }
})
app.get("/api/ltp/:symbol/:token", async (req, res) => {
  const { symbol, token } = req.params;
  try {
    console.log("Authenticating SmartAPI...");

    await authenticateSmartAPI(); 
    console.log("Authentication successful.");
    await delay(1000);

    const marketDataParams = {
      mode: "LTP",
      exchangeTokens: {
        NSE: [token], // Use the provided token
      },
    };

    console.log("Requesting market data with parameters:", marketDataParams);

    const data = await smartConnect.marketData(marketDataParams);

    console.log("Market data response:", JSON.stringify(data, null, 2));

    if (data.status && data.data && data.data.fetched.length > 0) {
      const ltp = data.data.fetched[0].ltp;
      res.json({ ltp });
    } else {
      throw new Error(data.message || "LTP data not found in response");
    }
  } catch (error) {
    console.error("Error fetching LTP data:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to fetch LTP data" });
  }
});

app.get("/api/placeorder/:symbol/:token/:quantity", async (req, res) => {
  const { symbol, token, quantity } = req.params;
  try {
    console.log("Authenticating SmartAPI...");

    await authenticateSmartAPI(); // Ensure you are authenticated before making the request
    console.log("Authentication successful.");
    await delay(1000);

    const marketDataParams = {
      variety: "NORMAL",
      tradingsymbol: symbol,
      symboltoken: token,
      transactiontype: "BUY",
      exchange: "NSE",
      ordertype: "MARKET",
      producttype: "DELIVERY",
      duration: "DAY",
      price: "0",
      squareoff: "0",
      stoploss: "0",
      quantity: quantity,
    };

    console.log(
      "Requesting market data for placing the orders with parameters:",
      marketDataParams
    );

    const data = await smartConnect.placeOrder(marketDataParams);

    console.log("Market data response:", JSON.stringify(data, null, 2));

    res.json(data);
  } catch (error) {
    console.error("Error fetching LTP data:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to fetch LTP data" });
  }
});

// Database connection setup
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "mann17303",
  database: "trading",
  authPlugins: {
    mysql_clear_password: () => () => Buffer.from("mann17303"),
  },
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err.stack);
    return;
  }
  console.log("Connected to database successfully");
});

app.get("/api/company/:symbol", (req, res) => {
  const { symbol } = req.params;
  const cacheKey = `company_${symbol}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log(`Cache hit for ${cacheKey}`);
    return res.json(cachedData);
  }
  connection.query(
    `SELECT *, CONVERT_TZ(DTE_TME, @@session.time_zone, '+00:00') AS DTE_TME_UTC FROM fact_stock_price WHERE SYMBOL = ?`,
    [symbol],
    (err, results) => {
      if (err) {
        console.error(`Error fetching data for ${symbol}:`, err);
        res
          .status(500)
          .json({ error: `Internal Server Error: ${err.message}` });
      } else {
        cache.set(cacheKey, results);
        res.json(results);
      }
    }
  );
});

app.get("/api/companies-with-spread", (req, res) => {
  // const cacheKey = "companies_with_spread";

  // // const cachedData = cache.get(cacheKey);
  // if (cachedData) {
  //   console.log(`Cache hit for ${cacheKey}`);
  //   return res.json(cachedData);
  // }

  const query = `
  WITH cte_spread AS (
    SELECT
      SYMBOL,
      ((HIGH - LOW) / LOW) * 100 AS spread
    FROM
      trading.fact_stock_price
    WHERE
      SYMBOL NOT LIKE '%NSETEST%'
  )
  SELECT *
  FROM cte_spread
  WHERE spread > 10
  ORDER BY spread DESC
  LIMIT 20;
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      // cache.set(cacheKey, results);
      res.json(results);
    }
  });
});

app.get("/api/macd/:symbol", (req, res) => {
  const { symbol } = req.params;
  const cacheKey = `macd_${symbol}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log(`Cache hit for ${cacheKey}`);
    return res.json(cachedData);
  }

  connection.query(
    `SELECT DTE_TME, CLOSE FROM fact_stock_price WHERE SYMBOL = ? ORDER BY DTE_TME`,
    [symbol],
    (err, results) => {
      if (err) {
        console.error(`Error fetching MACD data for ${symbol}:`, err);
        res
          .status(500)
          .json({ error: `Internal Server Error: ${err.message}` });
      } else {
        const macdData = calculateMACD(
          results.map((item) => ({ date: item.DTE_TME, close: item.CLOSE }))
        );
        cache.set(cacheKey, macdData);
        res.json(macdData);
      }
    }
  );
});

function calculateMACD(data) {
  const shortPeriod = 12; //Short period for calculating the short-term EMA (Exponential Moving Average).
  const longPeriod = 26; // Long period for calculating the long-term EMA.
  const signalPeriod = 9; //Period for calculating the signal line, which is an EMA of the MACD line.

  let emaShort = calculateEMA(
    data.map((item) => item.close),
    shortPeriod
  ); // Calculates the short-term EMA for the closing prices.
  let emaLong = calculateEMA(
    data.map((item) => item.close),
    longPeriod
  ); //Calculates the long-term EMA for the closing prices.

  let macd = emaShort.map((shortEma, index) => shortEma - emaLong[index]); //Calculates the MACD line by subtracting the long-term EMA from the short-term EMA.
  let signal = calculateEMA(macd, signalPeriod); //Calculates the signal line, which is the EMA of the MACD line.
  let histogram = macd.map((macdValue, index) => macdValue - signal[index]); //Calculates the histogram, which is the difference between the MACD line and the signal line.

  return data.map((item, index) => ({
    date: item.date,
    macd: macd[index],
    signal: signal[index],
    histogram: histogram[index],
  }));
}

function calculateEMA(prices, period) {
  let k = 2 / (period + 1);
  let emaArray = [prices[0]];
  for (let i = 1; i < prices.length; i++) {
    emaArray.push(prices[i] * k + emaArray[i - 1] * (1 - k));
  }
  return emaArray;
}

app.get("/api/get-symbols", (req, res) => {
  const cacheKey = "symbols";

  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log(`Cache hit for ${cacheKey}`);
    return res.json(cachedData);
  }
  const query = `
    SELECT * FROM trading.vw_get_symbols;
  `;

  console.log("Executing query:");
  console.log(query);

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      console.log("Query executed successfully. Results:");
      console.log(results);
      cache.set(cacheKey, results);
      res.json(results);
    }
  });
});

app.get("/api/get-dates", (req, res) => {
  const cacheKey = "dates";

  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log(`Cache hit for ${cacheKey}`);
    return res.json(cachedData);
  }
  const query = `
  SELECT * FROM trading.vw_get_unique_dates;
  `;

  console.log("Executing query:");
  console.log(query);

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      console.log("Query executed successfully. Results:");
      console.log(results);
      cache.set(cacheKey, results);
      res.json(results);
    }
  });
});
app.get("/api/top-companies/:date", (req, res) => {
  const { date } = req.params;
  const cacheKey = `top_companies_${date}`;

  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log(`Cache hit for ${cacheKey}`);
    return res.json(cachedData);
  }

  const query = `SELECT * FROM trading.gainer_looser where DTE_TME = ? and gainer_actual <= 5;
`;

  connection.query(query, [date, date], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      cache.set(cacheKey, results);
      res.json(results);
    }
  });
});

app.get("/api/least-companies/:date", (req, res) => {
  const { date } = req.params;
  const cacheKey = `least_companies_${date}`;

  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log(`Cache hit for ${cacheKey}`);
    return res.json(cachedData);
  }

  const query = `
  SELECT * FROM trading.gainer_looser where DTE_TME = ? and looser_actual <= 5;
  `;

  connection.query(query, [date, date], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      cache.set(cacheKey, results);
      res.json(results);
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
