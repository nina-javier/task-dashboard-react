import { Inbox } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="empty-state flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 p-16 text-gray-500">
      <Inbox size={24} aria-hidden="true" />
      <p className="text-sm">No tasks match the current filters.</p>
    </div>
  );
}
