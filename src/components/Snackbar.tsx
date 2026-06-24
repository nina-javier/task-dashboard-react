import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

interface SnackbarProps {
  message: string;
  onDismiss: () => void;
  durationMs?: number;
}

export default function Snackbar({ message, onDismiss, durationMs = 3000 }: SnackbarProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [onDismiss, durationMs, message]);

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-lg"
    >
      <CheckCircle2 size={16} className="text-green-400" aria-hidden="true" />
      {message}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="ml-2 text-gray-400 hover:text-white"
      >
        <X size={14} />
      </button>
    </div>
  );
}
