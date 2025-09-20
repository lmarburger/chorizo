import { ChoreScheduleWithCompletion, Task } from "./db";
import { parseLocalDate } from "./utils";

export type ItemStatus = "overdue" | "today" | "upcoming" | "completed";

export interface SortableItem {
  type: "chore" | "task";
  id: string;
  name: string;
  status: ItemStatus;
  isCompleted: boolean;
  completedAt?: Date;
  dayOfWeek?: string;
  dueDate?: Date;
  dayNumber?: number;
  data: ChoreScheduleWithCompletion | Task;
}

function getChoreStatus(chore: ChoreScheduleWithCompletion, todayIndex: number, dayOrder: string[]): ItemStatus {
  if (chore.is_completed) return "completed";

  const choreIndex = dayOrder.indexOf(chore.day_of_week);
  if (choreIndex < todayIndex) return "overdue";
  if (choreIndex === todayIndex) return "today";
  return "upcoming";
}

function getTaskStatus(task: Task, today: Date): ItemStatus {
  if (task.completed_at) return "completed";

  const dueDate = parseLocalDate(task.due_date);
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  if (dueDate < todayStart) return "overdue";
  if (dueDate.getTime() === todayStart.getTime()) return "today";
  return "upcoming";
}

export function createSortableItems(
  chores: ChoreScheduleWithCompletion[],
  tasks: Task[],
  today: Date = new Date()
): SortableItem[] {
  const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const currentDay = today.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const todayIndex = dayOrder.indexOf(currentDay);

  const items: SortableItem[] = [];

  // Add chores
  chores.forEach(chore => {
    const status = getChoreStatus(chore, todayIndex, dayOrder);
    const choreIndex = dayOrder.indexOf(chore.day_of_week);
    items.push({
      type: "chore",
      id: `chore-${chore.id}-${chore.day_of_week}`,
      name: chore.chore_name, // Use the correct field name
      status,
      isCompleted: chore.is_completed,
      completedAt: chore.completed_at ? new Date(chore.completed_at) : undefined,
      dayOfWeek: chore.day_of_week,
      dayNumber: choreIndex,
      data: chore,
    });
  });

  // Add tasks
  tasks.forEach(task => {
    const status = getTaskStatus(task, today);
    items.push({
      type: "task",
      id: `task-${task.id}`,
      name: task.title,
      status,
      isCompleted: !!task.completed_at,
      completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
      dueDate: parseLocalDate(task.due_date),
      data: task,
    });
  });

  return items;
}

export function sortItems(items: SortableItem[]): SortableItem[] {
  return [...items].sort((a, b) => {
    // First, separate completed from incomplete
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }

    // For completed items, sort by completion time (most recent first)
    if (a.isCompleted && b.isCompleted) {
      if (a.completedAt && b.completedAt) {
        return b.completedAt.getTime() - a.completedAt.getTime();
      }
      return 0;
    }

    // For incomplete items, determine if they're current/overdue or future
    const aIsCurrentOrPast = a.status === "overdue" || a.status === "today";
    const bIsCurrentOrPast = b.status === "overdue" || b.status === "today";

    // Sort order for incomplete items:
    // 1. Tasks due today or earlier
    // 2. Chores due today or earlier
    // 3. Future tasks
    // 4. Future chores

    if (aIsCurrentOrPast && bIsCurrentOrPast) {
      // Both are current/overdue
      if (a.type !== b.type) {
        // Tasks come before chores
        return a.type === "task" ? -1 : 1;
      }
      // Same type, sort by name (with null safety)
      const aName = a.name || "";
      const bName = b.name || "";
      return aName.localeCompare(bName);
    }

    if (!aIsCurrentOrPast && !bIsCurrentOrPast) {
      // Both are future
      if (a.type !== b.type) {
        // Tasks come before chores
        return a.type === "task" ? -1 : 1;
      }

      // Same type, sort by day then name
      if (a.type === "task" && b.type === "task") {
        // Sort tasks by due date
        if (a.dueDate && b.dueDate) {
          const dateDiff = a.dueDate.getTime() - b.dueDate.getTime();
          if (dateDiff !== 0) return dateDiff;
        }
      } else if (a.type === "chore" && b.type === "chore") {
        // Sort chores by day of week
        if (a.dayNumber !== undefined && b.dayNumber !== undefined && a.dayNumber !== b.dayNumber) {
          return a.dayNumber - b.dayNumber;
        }
      }

      // Same day, sort by name (with null safety)
      const aName = a.name || "";
      const bName = b.name || "";
      return aName.localeCompare(bName);
    }

    // One is current/past, one is future
    return aIsCurrentOrPast ? -1 : 1;
  });
}
