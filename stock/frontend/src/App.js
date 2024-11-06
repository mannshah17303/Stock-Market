import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import MyComponent from './MyComponent';
import TreeMap from './TreeMap';
import GainersLosersTable from './GainersLosersTable';
import BuySell from './BuySell';
import HoldingsData from './HoldingsData';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MyComponent />} />
        <Route path="/TreeMap" element={<TreeMap />} />
        <Route path="/gainers-losers-table" element={<GainersLosersTable />} />
        <Route path="/buy-sell" element={<BuySell />} />
        <Route path="/holdings" element={<HoldingsData />} />
      </Routes>
    </Router>
  );
}

export default App;
