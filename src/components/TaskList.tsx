import TaskCard from "./TaskCard";
import VirtualList from "./VirtualList";
import type { Task, TaskStatus } from "../types/task";

const ROW_HEIGHT = 140;
const MAX_LIST_HEIGHT = 760;

interface TaskListProps {
  tasks: Task[];
  onStatusChange: (id: string, status: TaskStatus) => void;
}

export default function TaskList({ tasks, onStatusChange }: TaskListProps) {
  // Small lists render at their natural height (no internal scrollbar);
  // the viewport only caps out — and windowing only kicks in — once the
  // list is taller than MAX_LIST_HEIGHT (e.g. the synthetic 10k dataset).
  const height = Math.min(tasks.length * ROW_HEIGHT, MAX_LIST_HEIGHT);

  return (
    <VirtualList
      items={tasks}
      rowHeight={ROW_HEIGHT}
      height={height}
      getKey={(task) => task.id}
      renderItem={(task) => <TaskCard task={task} onStatusChange={onStatusChange} />}
    />
  );
}
