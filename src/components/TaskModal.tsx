import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import Modal from "./Modal";
import type { Task, TaskInput, TaskPriority, TaskStatus } from "../types/task";

interface TaskModalProps {
  mode: "create" | "edit";
  task?: Task;
  isSaving: boolean;
  onClose: () => void;
  onSave: (input: TaskInput) => void;
  onRequestDelete?: () => void;
}

export default function TaskModal({
  mode,
  task,
  isSaving,
  onClose,
  onSave,
  onRequestDelete,
}: TaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "todo");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium");
  const [assignee, setAssignee] = useState(task?.assignee ?? "");
  const [titleError, setTitleError] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (title.trim() === "") {
      setTitleError(true);
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assignee: assignee.trim(),
    });
  };

  return (
    <Modal
      title={mode === "create" ? "Create Task" : "Edit Task"}
      onClose={onClose}
      footer={
        <>
          {mode === "edit" && onRequestDelete && (
            <button
              type="button"
              onClick={onRequestDelete}
              disabled={isSaving}
              className="mr-auto flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 size={14} aria-hidden="true" />
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="task-modal-form"
            disabled={isSaving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isSaving ? "Saving…" : mode === "create" ? "Create Task" : "Save changes"}
          </button>
        </>
      }
    >
      <form id="task-modal-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="task-title" className="mb-1 block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            id="task-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setTitleError(false);
            }}
            className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
              titleError
                ? "border-red-400 focus:ring-red-400"
                : "border-gray-300 focus:ring-blue-500"
            }`}
          />
          {titleError && <p className="mt-1 text-xs text-red-600">Title is required.</p>}
        </div>

        <div>
          <label
            htmlFor="task-description"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-status" className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="task-priority"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Priority
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="task-assignee" className="mb-1 block text-sm font-medium text-gray-700">
            Assignee
          </label>
          <input
            id="task-assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </form>
    </Modal>
  );
}
