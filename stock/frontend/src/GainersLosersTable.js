import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./GainersLosersTable.css"; 

const GainersLosersTable = () => {
  const [gainersData, setGainersData] = useState([]);
  const [losersData, setLosersData] = useState([]);
  const [percGainersData, setPercGainersData] = useState([]);
  const [percLosersData, setPercLosersData] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGainersLosersData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/gainers-losers"
        );
        setGainersData(response.data.gainers.data);
        setLosersData(response.data.losers.data);
        setPercGainersData(response.data.percgainers.data);
        setPercLosersData(response.data.perclosers.data);
      } catch (error) {
        setError(
          error.message ||
            "An error occurred while fetching gainers and losers data."
        );
      }
    };

    fetchGainersLosersData();
  }, []);

  const handleNavigate = () => {
    navigate("/TreeMap"); 
  };

  const handleNavigateToTable = async () => {
    navigate("/gainers-losers-table");
  };

  const handleBuySell = () => {
    navigate("/buy-sell"); 
  };

  const handleHomePage = () => {
    navigate("/");
  };

  const handleHoldings = () => {
    navigate("/holdings");
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <nav className="navbar flex-column">
          <div className="dropdown1 custom-typeahead">
            <button onClick={handleBuySell}>Buy-Sell</button>
          </div>
          <button onClick={handleNavigate}>Show Treemap</button>
          <button onClick={handleNavigateToTable}>gainers-losers</button>
          <button onClick={handleHoldings}>Holdings</button>
        </nav>
      </div>
      <div className="main">
        <div className="heading">
          <h1 onClick={handleHomePage}>Data Decode</h1>
        </div>

        <h2 style={{ color: "green" }}> Open Interest Gainers</h2>
        <div className="grid-container">
          {gainersData.map((item, index) => (
            <div
              key={item.tradingSymbol}
              className={`grid-item ${
                item.percentChange > 0 ? "gainer" : "loser"
              }`}
            >
              <p>
                <strong style={{ color: "black" }}>Trading Symbol:</strong>{" "}
                {item.tradingSymbol}
              </p>
              <p>
                <strong style={{ color: "black" }}>Percent Change:</strong>{" "}
                {item.percentChange}%
              </p>
              <p>
                <strong style={{ color: "black" }}>Symbol Token:</strong>{" "}
                {item.symbolToken}
              </p>
              <p>
                <strong style={{ color: "black" }}>Open Interest:</strong>{" "}
                {item.opnInterest}
              </p>
              <p>
                <strong style={{ color: "black" }}>
                  Net Change Open Interest:
                </strong>{" "}
                {item.netChangeOpnInterest}
              </p>
            </div>
          ))}
        </div>

        <h2 style={{ color: "red" }}>Open Interest Losers</h2>
        <div className="grid-container">
          {losersData.map((item, index) => (
            <div
              key={item.tradingSymbol}
              className={`grid-item ${
                item.percentChange > 0 ? "gainer" : "loser"
              }`}
            >
              <p>
                <strong style={{ color: "black" }}>Trading Symbol:</strong>{" "}
                {item.tradingSymbol}
              </p>
              <p>
                <strong style={{ color: "black" }}>Percent Change:</strong>{" "}
                {item.percentChange}%
              </p>
              <p>
                <strong style={{ color: "black" }}>Symbol Token:</strong>{" "}
                {item.symbolToken}
              </p>
              <p>
                <strong style={{ color: "black" }}>Open Interest:</strong>{" "}
                {item.opnInterest}
              </p>
              <p>
                <strong style={{ color: "black" }}>
                  Net Change Open Interest:
                </strong>{" "}
                {item.netChangeOpnInterest}
              </p>
            </div>
          ))}
        </div>

        <h2 style={{ color: "green" }}>Percentage Gainers</h2>
        <div className="grid-container">
          {percGainersData.map((item, index) => (
            <div
              key={item.tradingSymbol}
              className={`grid-item ${
                item.percentChange > 0 ? "gainer" : "loser"
              }`}
            >
              <p>
                <strong style={{ color: "black" }}>Trading Symbol:</strong>{" "}
                {item.tradingSymbol}
              </p>
              <p>
                <strong style={{ color: "black" }}>Percent Change:</strong>{" "}
                {item.percentChange}%
              </p>
              <p>
                <strong style={{ color: "black" }}>Symbol Token:</strong>{" "}
                {item.symbolToken}
              </p>
              <p>
                <strong style={{ color: "black" }}>Ltp:</strong> {item.ltp}
              </p>
              <p>
                <strong style={{ color: "black" }}>Net Change:</strong>{" "}
                {item.netChange}
              </p>
            </div>
          ))}
        </div>

        <h2 style={{ color: "red" }}>Percentage Losers</h2>
        <div className="grid-container">
          {percLosersData.map((item, index) => (
            <div
              key={item.tradingSymbol}
              className={`grid-item ${
                item.percentChange > 0 ? "gainer" : "loser"
              }`}
            >
              <p>
                <strong style={{ color: "black" }}>Trading Symbol:</strong>{" "}
                {item.tradingSymbol}
              </p>
              <p>
                <strong style={{ color: "black" }}>Percent Change:</strong>{" "}
                {item.percentChange}%
              </p>
              <p>
                <strong style={{ color: "black" }}>Symbol Token:</strong>{" "}
                {item.symbolToken}
              </p>
              <p>
                <strong style={{ color: "black" }}>Ltp:</strong> {item.ltp}
              </p>
              <p>
                <strong style={{ color: "black" }}>Net Change:</strong>{" "}
                {item.netChange}
              </p>
            </div>
          ))}
        </div>

        <footer className="footer">
          <div className="footer-content">
            <p>&copy; 2024 Apex Trading</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default GainersLosersTable;
