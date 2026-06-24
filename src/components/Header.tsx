import { ChevronDown, Menu } from "lucide-react";

export default function Header() {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Toggle navigation"
          className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
        >
          <Menu size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Task Dashboard</h1>
      </div>

      <button
        type="button"
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-100"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 font-medium text-violet-700">
          N
        </span>
        <span className="text-sm font-medium text-gray-900">Nina</span>
        <ChevronDown size={16} className="text-gray-500" />
      </button>
    </header>
  );
}
