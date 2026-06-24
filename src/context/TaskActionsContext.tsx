import {
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTasks } from "../hooks/useTasks";
import type { Task, TaskInput, TaskStatus, TasksState } from "../types/task";

// Lazy-loaded: these only ever mount once the user opens a modal/dialog/
// snackbar, so keeping them out of the main bundle (like `TaskStats`) means
// every page load skips their JS until that first interaction.
const TaskModal = lazy(() => import("../components/TaskModal"));
const ConfirmDialog = lazy(() => import("../components/ConfirmDialog"));
const Snackbar = lazy(() => import("../components/Snackbar"));

type ModalState = { mode: "create" } | { mode: "edit"; task: Task } | null;

// Split in two so that consumers needing only the stable action triggers
// (Header, TaskCard) don't re-render whenever `state` changes elsewhere —
// TaskCard reading a context that includes `state` would re-render on every
// task mutation regardless of React.memo, since memo only compares props.
interface TaskDataValue {
  state: TasksState;
  refetch: () => void;
  setStatus: (id: string, status: TaskStatus) => void;
}

interface TaskActionsValue {
  openCreate: () => void;
  openEdit: (task: Task) => void;
}

const TaskDataContext = createContext<TaskDataValue | null>(null);
const TaskActionsContext = createContext<TaskActionsValue | null>(null);

export function TaskActionsProvider({ children }: { children: ReactNode }) {
  const { state, refetch, setStatus, createTask, updateTask, deleteTask } = useTasks();
  const [modal, setModal] = useState<ModalState>(null);
  const [confirmTask, setConfirmTask] = useState<Task | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreate = useCallback(() => setModal({ mode: "create" }), []);
  const openEdit = useCallback((task: Task) => setModal({ mode: "edit", task }), []);
  const closeModal = useCallback(() => setModal(null), []);
  const cancelDelete = useCallback(() => setConfirmTask(null), []);

  const handleSave = useCallback(
    async (input: TaskInput) => {
      setIsSaving(true);
      try {
        if (modal?.mode === "edit") {
          await updateTask(modal.task.id, input);
          setSnackbarMessage("Task saved successfully.");
        } else {
          await createTask(input);
          setSnackbarMessage("Task created successfully.");
        }
        setModal(null);
      } finally {
        setIsSaving(false);
      }
    },
    [modal, createTask, updateTask],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmTask) return;
    setIsDeleting(true);
    try {
      await deleteTask(confirmTask.id);
      setConfirmTask(null);
      setModal(null);
      setSnackbarMessage("Task deleted successfully.");
    } finally {
      setIsDeleting(false);
    }
  }, [confirmTask, deleteTask]);

  const dataValue = useMemo<TaskDataValue>(
    () => ({ state, refetch, setStatus }),
    [state, refetch, setStatus],
  );

  const actionsValue = useMemo<TaskActionsValue>(
    () => ({ openCreate, openEdit }),
    [openCreate, openEdit],
  );

  return (
    <TaskDataContext.Provider value={dataValue}>
      <TaskActionsContext.Provider value={actionsValue}>
        {children}

        <Suspense fallback={null}>
          {modal && (
            <TaskModal
              mode={modal.mode}
              task={modal.mode === "edit" ? modal.task : undefined}
              isSaving={isSaving}
              onClose={closeModal}
              onSave={handleSave}
              onRequestDelete={
                modal.mode === "edit" ? () => setConfirmTask(modal.task) : undefined
              }
            />
          )}

          {confirmTask && (
            <ConfirmDialog
              title="Delete task?"
              message={`Are you sure you want to delete "${confirmTask.title}"? This action cannot be undone.`}
              isConfirming={isDeleting}
              onConfirm={handleConfirmDelete}
              onCancel={cancelDelete}
            />
          )}

          {snackbarMessage && (
            <Snackbar message={snackbarMessage} onDismiss={() => setSnackbarMessage(null)} />
          )}
        </Suspense>
      </TaskActionsContext.Provider>
    </TaskDataContext.Provider>
  );
}

// PRP §2 colocates providers and their hooks in one file; that's a known
// false positive for the fast-refresh rule in context+hook patterns.
// eslint-disable-next-line react-refresh/only-export-components
export function useTaskData(): TaskDataValue {
  const ctx = useContext(TaskDataContext);
  if (!ctx) {
    throw new Error("useTaskData must be used within a TaskActionsProvider");
  }
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTaskActions(): TaskActionsValue {
  const ctx = useContext(TaskActionsContext);
  if (!ctx) {
    throw new Error("useTaskActions must be used within a TaskActionsProvider");
  }
  return ctx;
}
