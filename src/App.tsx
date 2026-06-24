import Dashboard from "./components/Dashboard";
import Header from "./components/Header";
import { FilterProvider } from "./context/FilterContext";

function App() {
  return (
    <FilterProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Dashboard />
      </div>
    </FilterProvider>
  );
}

export default App;
