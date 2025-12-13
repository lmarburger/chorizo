import { ChoreScheduleWithCompletion, Task } from "./db";
import { parseLocalDate } from "./utils";
import { getClientCurrentDate } from "./time";

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
  isFixed: boolean;
  isExcused: boolean;
  isCompletable: boolean;
  data: ChoreScheduleWithCompletion | Task;
}

function getChoreStatus(chore: ChoreScheduleWithCompletion, todayIndex: number, dayOrder: string[]): ItemStatus {
  if (chore.is_completed || chore.excused) return "completed";

  const choreIndex = dayOrder.indexOf(chore.day_of_week);
  if (choreIndex < todayIndex) return "overdue";
  if (choreIndex === todayIndex) return "today";
  return "upcoming";
}

function getTaskStatus(task: Task, today: Date): ItemStatus {
  if (task.completed_at || task.excused_at) return "completed";

  const dueDate = parseLocalDate(task.due_date);
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  if (dueDate < todayStart) return "overdue";
  if (dueDate.getTime() === todayStart.getTime()) return "today";
  return "upcoming";
}

function isChoreCompletable(chore: ChoreScheduleWithCompletion, todayIndex: number, dayOrder: string[]): boolean {
  if (chore.is_completed || chore.excused) return false;

  const choreIndex = dayOrder.indexOf(chore.day_of_week);

  // Fixed chores can only be completed on their scheduled day
  if (!chore.flexible) {
    return choreIndex === todayIndex;
  }

  // Flexible chores can be completed any time up to and including their scheduled day
  // or on any day during the week (past or present)
  return choreIndex <= todayIndex || choreIndex >= 0;
}

export function createSortableItems(
  chores: ChoreScheduleWithCompletion[],
  tasks: Task[],
  today: Date = getClientCurrentDate()
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
      name: chore.chore_name,
      status,
      isCompleted: chore.is_completed || chore.excused,
      completedAt: chore.completed_at ? new Date(chore.completed_at) : undefined,
      dayOfWeek: chore.day_of_week,
      dayNumber: choreIndex,
      isFixed: !chore.flexible,
      isExcused: chore.excused,
      isCompletable: isChoreCompletable(chore, todayIndex, dayOrder),
      data: chore,
    });
  });

  // Add tasks
  tasks.forEach(task => {
    const status = getTaskStatus(task, today);
    const isCompleted = !!task.completed_at || !!task.excused_at;
    items.push({
      type: "task",
      id: `task-${task.id}`,
      name: task.title,
      status,
      isCompleted,
      completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
      dueDate: parseLocalDate(task.due_date),
      isFixed: false, // Tasks are never "fixed"
      isExcused: !!task.excused_at,
      isCompletable: !isCompleted, // Tasks can be completed anytime
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

    // For incomplete items, primary sort by day
    // Get the day number for sorting (0-6 for Mon-Sun)
    const getDayNumber = (item: SortableItem): number => {
      if (item.type === "chore") {
        return item.dayNumber ?? 0;
      } else {
        // For tasks, get day of week from due date
        if (item.dueDate) {
          const day = item.dueDate.getDay();
          return day === 0 ? 6 : day - 1; // Convert to Mon=0, Sun=6
        }
        return 0;
      }
    };

    const aDayNum = getDayNumber(a);
    const bDayNum = getDayNumber(b);

    // Primary sort: by day number
    if (aDayNum !== bDayNum) {
      return aDayNum - bDayNum;
    }

    // Secondary sort within the same day:
    // 1. "Must do today" items (fixed chores for today + tasks due today) come first
    // 2. Then by type (tasks before chores for visual consistency)
    // 3. Then alphabetically

    const aIsMustDoToday = (a.isFixed && a.status === "today") || (a.type === "task" && a.status === "today");
    const bIsMustDoToday = (b.isFixed && b.status === "today") || (b.type === "task" && b.status === "today");

    if (aIsMustDoToday !== bIsMustDoToday) {
      return aIsMustDoToday ? -1 : 1;
    }

    // Then sort by type (tasks before chores)
    if (a.type !== b.type) {
      return a.type === "task" ? -1 : 1;
    }

    // Finally, sort by name
    const aName = a.name || "";
    const bName = b.name || "";
    return aName.localeCompare(bName);
  });
}
