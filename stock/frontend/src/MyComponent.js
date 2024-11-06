import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Plot from "react-plotly.js";
import "./App.css";
import { Dropdown } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "react-bootstrap-typeahead/css/Typeahead.css";

const MyComponent = () => {
  const [topCompanies, setTopCompanies] = useState([]);
  const [leastCompanies, setLeastCompanies] = useState([]);
  const [fetchCompanies, setFetchCompanies] = useState([]);
  const [fetchDates, setFetchDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [macdData, setMacdData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartTitle, setChartTitle] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [companyResponse, dateResponse] = await Promise.all([
          axios.get("http://localhost:5000/api/get-symbols"),
          axios.get("http://localhost:5000/api/get-dates"),
        ]);

        setFetchCompanies(companyResponse.data);

        const dates = dateResponse.data.map(
          (dateObj) => new Date(dateObj.DTE_TME)
        );
        setFetchDates(dates);
        const reversedDates = dates.reverse();
        let topResponse = null;
        // Find the latest date with data available
        for (const date of reversedDates) {
          const formattedDate = date.toISOString().split("T")[0];
          try {
            const [topRes, leastResponse] = await Promise.all([
              axios.get(
                `http://localhost:5000/api/top-companies/${formattedDate}`
              ),
              axios.get(
                `http://localhost:5000/api/least-companies/${formattedDate}`
              ),
            ]);
            if (topRes.data.length > 0 && leastResponse.data.length > 0) {
              topResponse = topRes;
              setSelectedDate(date);
              setTopCompanies(topResponse.data);
              setLeastCompanies(leastResponse.data);
              break;
            }
          } catch (err) {
            console.log(`No data for ${formattedDate}, trying next date...`);
          }
        }
        const randomCompany =
          topResponse.data[Math.floor(Math.random() * topResponse.data.length)];

        if (randomCompany) {
          handleCompanySelect(randomCompany.SYMBOL);
        }
        setLoading(false);
      } catch (error) {
        setError(error.message || "An error occurred while fetching data.");
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedDate) return;

    const fetchTopCompanies = async () => {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      try {
        const response = await axios.get(
          `http://localhost:5000/api/top-companies/${formattedDate}`
        );
        setTopCompanies(response.data);
      } catch (error) {
        setError(
          error.message ||
            `An error occurred while fetching top companies for ${formattedDate}.`
        );
      }
    };

    const fetchLeastCompanies = async () => {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      try {
        const response = await axios.get(
          `http://localhost:5000/api/least-companies/${formattedDate}`
        );
        setLeastCompanies(response.data);
      } catch (error) {
        setError(
          error.message ||
            `An error occurred while fetching least companies for ${formattedDate}.`
        );
      }
    };

    fetchTopCompanies();
    fetchLeastCompanies();
  }, [selectedDate]);

  const handleCompanySelect = async (symbol) => {
    try {
      const [companyResponse, macdResponse] = await Promise.all([
        axios.get(`http://localhost:5000/api/company/${symbol}`),
        axios.get(`http://localhost:5000/api/macd/${symbol}`),
      ]);
      setSelectedCompany(companyResponse.data);
      setMacdData(macdResponse.data);
      setChartTitle(`${companyResponse.data[0].SYMBOL}`);
    } catch (error) {
      setError(
        error.message || `An error occurred while fetching data for ${symbol}.`
      );
    }
  };

  const handleDateChange = (date) => {
    const utcDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    setSelectedDate(utcDate);
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

  var layout = {
    dragmode: "zoom",
    showlegend: false,
    width: 1180,
    height: 600, // Increased height to accommodate the MACD chart
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
      text: chartTitle, // Dynamically set the chart title
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
          <Dropdown className="dropdown2">
            <Dropdown.Toggle variant="primary" id="dropdown-basic">
              {selectedDate ? selectedDate.toLocaleDateString() : "Select Date"}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                inline
                includeDates={fetchDates}
              />
            </Dropdown.Menu>
          </Dropdown>
          <div className="button-container">
            <button onClick={handleBuySell}>buy-sell</button>
            <button onClick={handleNavigate}>Show Treemap</button>
            <button onClick={handleNavigateToTable}>gainers-losers</button>
            <button onClick={handleHoldings}>Holdings</button>
          </div>
        </nav>
      </div>
      <div className="main">
        <div className="heading">
          <h1>Data Decode</h1>
          <h2>
            {selectedDate
              ? `Data for ${selectedDate.toLocaleDateString()}`
              : ""}
          </h2>
        </div>
        <div className="boxes">
          <div className="box">
            {topCompanies.slice(0, 5).map((company) => {
              const close = parseFloat(company.CLOSE_DIFF);
              const color = close >= 0 ? "green" : "red";
              return (
                <div
                  key={company.SYMBOL}
                  className="company-info"
                  onClick={() => handleCompanySelect(company.SYMBOL)}
                >
                  <p className={`company-name ${color}`}>
                    {`${company.SYMBOL} - ${
                      close >= 0 ? "+" : ""
                    }${close.toFixed(2)}%`}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="box">
            {leastCompanies.slice(0, 5).map((company) => {
              const close = parseFloat(company.CLOSE_DIFF);
              const color = close >= 0 ? "green" : "red";
              return (
                <div
                  key={company.SYMBOL}
                  className="company-info"
                  onClick={() => handleCompanySelect(company.SYMBOL)}
                >
                  <p className={`company-name ${color}`}>
                    {`${company.SYMBOL} - ${
                      close >= 0 ? "+" : ""
                    }${close.toFixed(2)}%`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="chart">
          {selectedCompany && (
            <Plot
              data={[
                {
                  x: selectedCompany.map((item) => item.DTE_TME),
                  open: selectedCompany.map((item) => parseFloat(item.OPEN)),
                  high: selectedCompany.map((item) => parseFloat(item.HIGH)),
                  low: selectedCompany.map((item) => parseFloat(item.LOW)),
                  close: selectedCompany.map((item) => parseFloat(item.CLOSE)),
                  type: "candlestick",
                  name: `${selectedCompany[0].SYMBOL} Candlestick Chart`,
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
        <footer className="footer">
          <div className="footer-content">
            <p>&copy; 2024 Apex Trading</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MyComponent;

// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import "./App.css";
// import { Dropdown } from "react-bootstrap";
// import { Typeahead } from "react-bootstrap-typeahead";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import "react-bootstrap-typeahead/css/Typeahead.css";
// import moment from 'moment';
// import Chart from "chart.js/auto";
// import 'chartjs-adapter-moment';

// const MyComponent = () => {
//   const [topCompanies, setTopCompanies] = useState([]);
//   const [leastCompanies, setLeastCompanies] = useState([]);
//   const [fetchCompanies, setFetchCompanies] = useState([]);
//   const [fetchDates, setFetchDates] = useState([]);
//   const [selectedDate, setSelectedDate] = useState(null);
//   const [selectedCompany, setSelectedCompany] = useState(null);
//   const [macdData, setMacdData] = useState(null);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [chartTitle, setChartTitle] = useState("");
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchInitialData = async () => {
//       try {
//         const [companyResponse, dateResponse] = await Promise.all([
//           axios.get("http://localhost:5000/api/get-symbols"),
//           axios.get("http://localhost:5000/api/get-dates"),
//         ]);

//         setFetchCompanies(companyResponse.data);

//         const dates = dateResponse.data.map(
//           (dateObj) => new Date(dateObj.DTE_TME)
//         );
//         setFetchDates(dates);
//         const reversedDates = dates.reverse();
//         // Find the latest date with data available
//         for (const date of reversedDates) {
//           const formattedDate = date.toISOString().split("T")[0];
//           try {
//             const [topResponse, leastResponse] = await Promise.all([
//               axios.get(
//                 `http://localhost:5000/api/top-companies/${formattedDate}`
//               ),
//               axios.get(
//                 `http://localhost:5000/api/least-companies/${formattedDate}`
//               ),
//             ]);
//             if (topResponse.data.length > 0 && leastResponse.data.length > 0) {
//               setSelectedDate(date);
//               setTopCompanies(topResponse.data);
//               setLeastCompanies(leastResponse.data);
//               break;
//             }
//           } catch (err) {
//             console.log(`No data for ${formattedDate}, trying next date...`);
//           }
//         }
//         const randomCompany =
//           companyResponse.data[
//             Math.floor(Math.random() * companyResponse.data.length)
//           ];
//         if (randomCompany) {
//           handleCompanySelect(randomCompany.SYMBOL);
//         }
//         setLoading(false);
//       } catch (error) {
//         setError(error.message || "An error occurred while fetching data.");
//         setLoading(false);
//       }
//     };

//     fetchInitialData();
//   }, []);

//   useEffect(() => {
//     if (!selectedDate) return;

//     const fetchTopCompanies = async () => {
//       const formattedDate = selectedDate.toISOString().split("T")[0];
//       try {
//         const response = await axios.get(
//           `http://localhost:5000/api/top-companies/${formattedDate}`
//         );
//         setTopCompanies(response.data);
//       } catch (error) {
//         setError(
//           error.message ||
//             `An error occurred while fetching top companies for ${formattedDate}.`
//         );
//       }
//     };

//     const fetchLeastCompanies = async () => {
//       const formattedDate = selectedDate.toISOString().split("T")[0];
//       try {
//         const response = await axios.get(
//           `http://localhost:5000/api/least-companies/${formattedDate}`
//         );
//         setLeastCompanies(response.data);
//       } catch (error) {
//         setError(
//           error.message ||
//             `An error occurred while fetching least companies for ${formattedDate}.`
//         );
//       }
//     };

//     fetchTopCompanies();
//     fetchLeastCompanies();
//   }, [selectedDate]);

//   const handleCompanySelect = async (symbol) => {
//     try {
//       const [companyResponse, macdResponse] = await Promise.all([
//         axios.get(`http://localhost:5000/api/company/${symbol}`),
//         axios.get(`http://localhost:5000/api/macd/${symbol}`),
//       ]);
//       setSelectedCompany(companyResponse.data);
//       setMacdData(macdResponse.data);
//       setChartTitle(`${companyResponse.data[0].SYMBOL}`);
//     } catch (error) {
//       setError(
//         error.message || `An error occurred while fetching data for ${symbol}.`
//       );
//     }
//   };

//   const handleDateChange = (date) => {
//     const utcDate = new Date(
//       Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
//     );
//     setSelectedDate(utcDate);
//   };

//   const handleNavigate = () => {
//     navigate("/TreeMap"); // Navigate to OtherComponent
//   };

//   const handleNavigateToTable = async () => {
//     navigate("/gainers-losers-table");
//   };

//   useEffect(() => {
//     if (!selectedCompany || !macdData) return;

//     const ctx = document.getElementById("myChart");
//     if (ctx) {
//       const existingChart = Chart.getChart(ctx);
//       if (existingChart) {
//         existingChart.destroy(); // Destroy the existing chart
//       }
//       const candlestickData = {
//         labels: selectedCompany.map((item) => {
//           const date = new Date(item.DTE_TME);
//           return date.toISOString().split("T")[0];
//         }),
//         datasets: [
//           {
//             label: "Candlestick",
//             data: selectedCompany
//               .map((item) => ({
//                 t: item.DTE_TME,
//                 o: parseFloat(item.OPEN),
//                 h: parseFloat(item.HIGH),
//                 l: parseFloat(item.LOW),
//                 c: parseFloat(item.CLOSE),
//               }))
//               .sort((a, b) => a.t - b.t),
//             backgroundColor: "rgba(255, 99, 132, 0.2)",
//             borderColor: "rgba(255, 99, 132, 1)",
//             borderWidth: 1,
//           },
//           {
//             label: "MACD",
//             data: macdData.map((item) => ({
//               x: item.date,
//               y: item.macd,
//             })),
//             borderColor: "rgba(54, 162, 235, 1)",
//             borderWidth: 1,
//             type: "line",
//             yAxisID: "y-axis-2",
//           },
//           {
//             label: "Signal Line",
//             data: macdData.map((item) => ({
//               x: item.date,
//               y: item.signal,
//             })),
//             borderColor: "rgba(255, 206, 86, 1)",
//             borderWidth: 1,
//             type: "line",
//             yAxisID: "y-axis-2",
//           },
//           {
//             label: "Histogram",
//             data: macdData.map((item) => ({
//               x: item.date,
//               y: item.histogram,
//             })),
//             backgroundColor: "rgba(75, 192, 192, 0.2)",
//             borderColor: "rgba(75, 192, 192, 1)",
//             borderWidth: 1,
//             type: "bar",
//             yAxisID: "y-axis-2",
//           },
//         ],
//       };

//       const options = {
//         scales: {
//           x: {
//             type: "time",
//             time: {
//               unit: ""
//             },
//           },
//           y: {
//             beginAtZero: false,
//           },
//           yAxes: [
//             {
//               type: "linear",
//               display: true,
//               position: "left",
//               id: "y-axis-1",
//             },
//             {
//               type: "linear",
//               display: true,
//               position: "right",
//               id: "y-axis-2",
//               grid: {
//                 drawOnChartArea: false,
//               },
//             },
//           ],
//         },
//       };

//       new Chart(ctx, {
//         type: "bar",
//         data: candlestickData,
//         options: options,
//       });
//     }
//   }, [selectedCompany, macdData]);

//   if (loading) {
//     return <p>Loading data...</p>;
//   }
//   if (error) {
//     return <p>Error: {error}</p>;
//   }

//   if (!Array.isArray(fetchCompanies) || fetchCompanies.length === 0) {
//     console.error("Invalid data format. Expected a non-empty array.");
//     return <p>Error: Invalid data format.</p>;
//   }

//   return (
//     <div className="app-container">
//       <div className="sidebar">
//         <nav className="navbar flex-column">
//           <Dropdown className="dropdown2">
//             <Dropdown.Toggle variant="primary" id="dropdown-basic">
//               {selectedDate ? selectedDate.toLocaleDateString() : "Select Date"}
//             </Dropdown.Toggle>
//             <Dropdown.Menu>
//               <DatePicker
//                 selected={selectedDate}
//                 onChange={handleDateChange}
//                 inline
//                 includeDates={fetchDates}
//               />
//             </Dropdown.Menu>
//           </Dropdown>
//           <div className="dropdown1 custom-typeahead">
//             <Typeahead
//               id="company-typeahead"
//               labelKey="SYMBOL"
//               options={fetchCompanies}
//               placeholder="Choose a company..."
//               onChange={(selected) => {
//                 if (selected.length > 0) {
//                   handleCompanySelect(selected[0].SYMBOL);
//                 }
//               }}
//               renderMenuItemChildren={(option) => <div>{option.SYMBOL}</div>}
//             />
//           </div>
//           <button onClick={handleNavigate}>Show Treemap</button>
//           <button onClick={handleNavigateToTable}>Show</button>
//         </nav>
//       </div>
//       <div className="main">
//         <div className="heading">
//           <h1>Data Decode</h1>
//           <h2>{selectedDate ? `Data for ${selectedDate.toLocaleDateString()}` : ""}</h2>
//         </div>
//         <div className="boxes">
//           <div className="box">
//             {topCompanies.slice(0, 5).map((company) => {
//               const close = parseFloat(company.CLOSE_DIFF);
//               const color = close >= 0 ? "green" : "red";
//               return (
//                 <div
//                   key={company.SYMBOL}
//                   className="company-info"
//                   onClick={() => handleCompanySelect(company.SYMBOL)}
//                 >
//                   <p className={`company-name ${color}`}>
//                     {`${company.SYMBOL} - ${
//                       close >= 0 ? "+" : ""
//                     }${close.toFixed(2)}%`}
//                   </p>
//                 </div>
//               );
//             })}
//           </div>
//           <div className="box">
//             {leastCompanies.slice(0, 5).map((company) => {
//               const close = parseFloat(company.CLOSE_DIFF);
//               const color = close >= 0 ? "green" : "red";
//               return (
//                 <div
//                   key={company.SYMBOL}
//                   className="company-info"
//                   onClick={() => handleCompanySelect(company.SYMBOL)}
//                 >
//                   <p className={`company-name ${color}`}>
//                     {`${company.SYMBOL} - ${
//                       close >= 0 ? "+" : ""
//                     }${close.toFixed(2)}%`}
//                   </p>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//         <div className="chart">
//           <canvas id="myChart"></canvas>
//         </div>
//         <footer className="footer">
//           <div className="footer-content">
//             <p>&copy; 2024 Apex Trading</p>
//           </div>
//         </footer>
//       </div>
//     </div>
//   );
// };

// export default MyComponent;
