import Dashboard from "./components/Dashboard";
import Header from "./components/Header";
import { FilterProvider } from "./context/FilterContext";
import { TaskActionsProvider } from "./context/TaskActionsContext";

function App() {
  return (
    <FilterProvider>
      <TaskActionsProvider>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Dashboard />
        </div>
      </TaskActionsProvider>
    </FilterProvider>
  );
}

export default App;
