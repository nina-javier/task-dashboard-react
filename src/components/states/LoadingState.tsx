export default function LoadingState() {
  return (
    <div
      role="status"
      className="loading-state flex flex-col items-center justify-center gap-3 p-16 text-gray-500"
    >
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
      <p className="text-sm">Loading tasks…</p>
    </div>
  );
}
