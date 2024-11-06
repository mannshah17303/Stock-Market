import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Plot from "react-plotly.js";
import "./App.css";
import { Typeahead } from "react-bootstrap-typeahead";
import "react-bootstrap-typeahead/css/Typeahead.css";
import "react-datepicker/dist/react-datepicker.css";

const BuySell = () => {
  const [fetchCompanies, setFetchCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [macdData, setMacdData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartTitle, setChartTitle] = useState("");
  const [showBuySell, setShowBuySell] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [total, setTotal] = useState(null);
  const [ltp, setLtp] = useState(null);
  const [companySelected, setCompanySelected] = useState(false);
  const navigate = useNavigate();
  const typeaheadRef = useRef();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const companyResponse = await axios.get("http://localhost:5000/api/get-symbols");
        if (companyResponse.data.length > 0) {
          setFetchCompanies(companyResponse.data);
          selectRandomCompany(companyResponse.data);
        } else {
          setError("No companies available");
        }
      } catch (error) {
        setError(error.message || "An error occurred while fetching data.");
        setLoading(false);
      }
    };

    const selectRandomCompany = async (companies) => {
      try {
        setLoading(true);
        const randomCompany = companies[0];
        const symbol = randomCompany.SYMBOL;
        const token = randomCompany.TOKEN;

        const [companyData, macdData, ltpData] = await Promise.all([
          axios.get(`http://localhost:5000/api/company/${symbol}`),
          axios.get(`http://localhost:5000/api/macd/${symbol}`),
          axios.get(`http://localhost:5000/api/ltp/${symbol}/${token}`)
        ]);

        setSelectedCompany({ ...randomCompany, data: companyData.data });
        setMacdData(macdData.data);
        setLtp(ltpData.data.ltp);
        setChartTitle(symbol);
        setCompanySelected(true);
        setShowBuySell(false);
        if (typeaheadRef.current) {
          typeaheadRef.current.clear();
        }
      } catch (error) {
        console.error("Error fetching company data:", error);
        setError(error.message || "An error occurred while fetching data for the random company.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleCompanySelect = async (selected) => {
    if (!selected || selected.length === 0) {
      setError("No company selected.");
      return;
    }

    const company = selected[0];
    const symbol = company.SYMBOL;
    const token = company.TOKEN;

    try {
      const [companyResponse, macdResponse, ltpResponse] = await Promise.all([
        axios.get(`http://localhost:5000/api/company/${symbol}`),
        axios.get(`http://localhost:5000/api/macd/${symbol}`),
        axios.get(`http://localhost:5000/api/ltp/${symbol}/${token}`)
      ]);

      console.log("Company Data:", companyResponse.data);
      console.log("MACD Data:", macdResponse.data);
      console.log("LTP Data:", ltpResponse.data);

      if (!companyResponse.data || !Array.isArray(companyResponse.data) || companyResponse.data.length === 0) {
        throw new Error("Invalid company data received.");
      }

      setSelectedCompany({ ...company, data: companyResponse.data });
      setMacdData(macdResponse.data);
      setLtp(ltpResponse.data.ltp);
      setChartTitle(symbol);
      setCompanySelected(true);
      setShowBuySell(false);
      if (typeaheadRef.current) {
        typeaheadRef.current.clear();
      }
    } catch (error) {
      setError(error.message || `An error occurred while fetching data for ${symbol}.`);
    }
  };

  const handleHomePage = () => {
    navigate("/");
  };

  const handleBuySellClick = () => {
    setShowBuySell(true);
    setPrice(ltp ? parseFloat(ltp).toFixed(2) : "");
  };

  const handleQuantityChange = (e) => {
    const enteredQuantity = e.target.value;
    const totalPrice = enteredQuantity * price;
    setQuantity(enteredQuantity);
    setTotal(totalPrice);
  };

  const handlePlaceOrder = async () => {
    if (!selectedCompany) {
      console.error("No company selected");
      return;
    }
    const { SYMBOL, TOKEN } = selectedCompany;
    console.log(`Placing order for symbol: ${SYMBOL}, token: ${TOKEN}, quantity: ${quantity}`);
    try {
      const placeOrderResponse = await axios.get(`http://localhost:5000/api/placeorder/${SYMBOL}/${TOKEN}/${quantity}`);
      console.log(placeOrderResponse);
      console.log("Order placed");
    } catch (error) {
      console.error("Error placing order:", error);
    }
  };

  if (loading) {
    return <p>Loading data...</p>;
  }
  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!Array.isArray(fetchCompanies) || fetchCompanies.length === 0) {
    console.error("Invalid data format. Expected a non-empty array.");
    return <p>Error: Invalid data format.</p>;
  }

  const layout = {
    dragmode: "zoom",
    showlegend: false,
    width: 1180,
    height: 700,
    margin: {
      t: 30,
      l: 50,
      r: 50,
      b: 30,
    },
    xaxis: {
      autorange: true,
      title: "Date",
      rangeselector: {
        x: 0,
        y: 1.2,
        xanchor: "left",
        font: { size: 8 },
        buttons: [
          {
            step: "month",
            stepmode: "backward",
            count: 1,
            label: "1 month",
          },
          {
            step: "month",
            stepmode: "backward",
            count: 6,
            label: "6 months",
          },
          {
            step: "all",
            label: "All dates",
          },
        ],
      },
    },
    yaxis: {
      autorange: true,
    },
    title: {
      text: chartTitle,
      font: {
        family: "Arial, sans-serif",
        size: 16,
        color: "#333",
      },
      xref: "paper",
      x: 0.5,
      xanchor: "center",
      y: 0.9,
      yanchor: "top",
    },
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <nav className="navbar flex-column">
          <div className="sidebar-content">
            <div className="dropdown1 custom-typeahead">
              <Typeahead
                id="company-typeahead"
                labelKey="SYMBOL"
                options={fetchCompanies}
                placeholder="Choose a company..."
                ref={typeaheadRef}
                onChange={handleCompanySelect}
                renderMenuItemChildren={(option) => <div>{option.SYMBOL}</div>}
              />
            </div>
            {showBuySell && selectedCompany && (
              <div className="buy-sell-inputs">
                <input
                  type="number"
                  placeholder="Quantity"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="input-field"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={ltp !== null}
                  className="input-field"
                />
                <button className="place-order" onClick={handlePlaceOrder}>
                  Pay Full {`@ ${parseFloat(total).toFixed(2)}`}
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
      <div className="main">
        <div className="heading">
          <h1 onClick={handleHomePage}>Data Decode</h1>
        </div>
        <div className="buy-sell">
          <button className="buy-button" onClick={handleBuySellClick}>
            Buy {ltp ? `@ ${parseFloat(ltp).toFixed(2)}` : ""}
          </button>
          <button className="sell-button" onClick={handleBuySellClick}>
            Sell {ltp ? `@ ${parseFloat(ltp).toFixed(2)}` : ""}
          </button>
        </div>
        <div className="chart">
          {selectedCompany && (
            <Plot
              data={[
                {
                  x: selectedCompany.data.map((item) => item.DTE_TME),
                  open: selectedCompany.data.map((item) => parseFloat(item.OPEN)),
                  high: selectedCompany.data.map((item) => parseFloat(item.HIGH)),
                  low: selectedCompany.data.map((item) => parseFloat(item.LOW)),
                  close: selectedCompany.data.map((item) => parseFloat(item.CLOSE)),
                  type: "candlestick",
                  name: `${selectedCompany.SYMBOL} Candlestick Chart`,
                },
                macdData && {
                  x: macdData.map((item) => item.date),
                  y: macdData.map((item) => item.macd),
                  type: "scatter",
                  mode: "lines",
                  name: "MACD",
                  yaxis: "y2",
                  line: { color: "blue" },
                },
                macdData && {
                  x: macdData.map((item) => item.date),
                  y: macdData.map((item) => item.signal),
                  type: "scatter",
                  mode: "lines",
                  name: "Signal Line",
                  yaxis: "y2",
                  line: { color: "red" },
                },
                macdData && {
                  x: macdData.map((item) => item.date),
                  y: macdData.map((item) => item.histogram),
                  type: "bar",
                  name: "Histogram",
                  yaxis: "y2",
                  marker: { color: "green" },
                },
              ]}
              layout={{
                ...layout,
                yaxis2: {
                  overlaying: "y",
                  side: "right",
                  title: "MACD",
                },
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BuySell;
