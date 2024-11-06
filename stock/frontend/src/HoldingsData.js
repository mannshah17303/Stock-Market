import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css";

const HoldingsData = () => {
  const [holdings, setHoldings] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchHoldingsData = async () => {
      try {
        const respose = await axios.get(
          "http://localhost:5000/api/getHoldings"
        );
        console.log(respose.data.data);
        setHoldings(respose.data.data);
      } catch (error) {
        setError(
          error.message ||
            "An error occurred while fetching gainers and losers data."
        );
      }
    };
    fetchHoldingsData();
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
  return (
    <div className="app-container">
      <div className="sidebar">
        <nav className="navbar flex-column">
          <div className="button-container">
            <button onClick={handleBuySell}>Buy-Sell</button>
            <button onClick={handleNavigate}>Show Treemap</button>
            <button onClick={handleNavigateToTable}>gainers-losers</button>
          </div>
        </nav>
      </div>
      <div className="main">
        <div className="heading">
          <h1 onClick={handleHomePage}>Data Decode</h1>
        </div>
        <table className="table table-dark">
          <thead>
            <tr>
              <th scope="col">No.</th>
              <th scope="col">Symbol</th>
              <th scope="col">Quantity</th>
              <th scope="col">Product</th>
              <th scope="col">ProfitAndLoss</th>
              <th scope="col">ProfitAndLossPercentage</th>
            </tr>
          </thead>
          <tbody>
            {holdings.length > 0 ? (
              holdings.map((holding, index) => (
                <tr key={index}>
                  <th scope="row">{index + 1}</th>
                  <td>{holding.tradingsymbol}</td>
                  <td>{holding.quantity}</td>
                  <td>{holding.product}</td>
                  <td>{holding.profitandloss}</td>
                  <td>{holding.pnlpercentage}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No holdings data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HoldingsData;
