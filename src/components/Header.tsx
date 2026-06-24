import { Plus } from "lucide-react";
import { useTaskActions } from "../context/TaskActionsContext";

export default function Header() {
  const { openCreate } = useTaskActions();

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
      <h1 className="text-xl font-bold text-gray-900">Task Dashboard</h1>
      <button
        type="button"
        onClick={openCreate}
        className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        <Plus size={16} aria-hidden="true" />
        Create Task
      </button>
    </header>
  );
}
