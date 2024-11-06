import React, { useState, useEffect } from "react";
import axios from "axios";
import { ResponsiveTreeMap } from "@nivo/treemap";
import { useNavigate } from "react-router-dom";
import "./App.css";

const TreeMap = () => {
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/companies-with-spread")
      .then((response) => {
        console.log("API response data:", response.data);

        // Transform data and handle duplicates
        const transformedData = {
          name: "companies",
          children: response.data.map((item, index) => ({
            name: item.SYMBOL, // Append index to ensure uniqueness
            value: parseFloat(item.spread),
          })),
        };
        console.log("Transformed data:", transformedData);
        setData(transformedData);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);

  const customLabelFunction = (node) => {
    return `${node.data.name}`;
  };

  const customColorFunction = (node) => {
    return node.data.value >= 50 ? "#00ff00" : "#ff0000";
  };

  const customTheme = {
    labels: {
      text: {
        fontWeight: "bold",
      },
    },
  };

  const handleNavigate = () => {
    navigate("/TreeMap");
  };

  const handleNavigateToTable = async () => {
    navigate("/gainers-losers-table");
  };

  const handleBuySell = () => {
    navigate("/buy-sell");
  };

  const handleHoldings = () => {
    navigate("/holdings");
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
            <button onClick={handleHoldings}>Holdings</button>
          </div>
        </nav>
      </div>
      <div className="main">
        <div className="heading">
          <h1 onClick={handleHomePage}>Data Decode</h1>
        </div>
        <div className="tree-chart">
          {data.children ? (
            <ResponsiveTreeMap
              data={data}
              identity="name"
              value="value"
              label={customLabelFunction}
              labelSkipSize={12}
              labelTextColor={{ from: "color", modifiers: [["darker", 1.2]] }}
              parentLabelPosition="left"
              parentLabelTextColor={{
                from: "color",
                modifiers: [["darker", 2]],
              }}
              borderColor={{ from: "color", modifiers: [["darker", 0.1]] }}
              colors={customColorFunction}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              theme={customTheme}
            />
          ) : (
            <p>Loading...</p>
          )}
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

export default TreeMap;
