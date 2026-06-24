import { AlertTriangle, RotateCw } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="error-state mx-auto flex max-w-[1600px] flex-col items-center gap-3 p-16 text-center text-gray-600"
    >
      <AlertTriangle size={28} className="text-red-500" aria-hidden="true" />
      <p className="text-sm">Failed to load tasks: {message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        <RotateCw size={14} aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}
