"use client";

import { useMemo } from "react";
import { createSortableItems, sortItems } from "../lib/sorting";
import { TaskEditForm } from "./task-edit-form";
import type { DayOfWeek, Task } from "../lib/db";

interface ChoreWithSchedule {
  id: number;
  chore_id: number;
  kid_name: string;
  day_of_week: string;
  chore_name: string;
  chore_description: string | null;
  day_number: number;
  chore_date: string;
  completion_id: number | null;
  completed_at: string | null;
  is_completed: boolean;
  flexible?: boolean;
  excused?: boolean;
  is_late_completion?: boolean;
}

interface KidStatusItemsProps {
  outstandingChores: ChoreWithSchedule[];
  allIncompleteTasks: Task[];
  editingTaskId: number | null;
  onEditTask: (taskId: number) => void;
  onUpdateTask: (taskId: number, values: { title: string; description: string; due_date: string }) => void;
  onDeleteTask: (taskId: number) => void;
  onCancelEdit: () => void;
  onExcuse?: (type: "chore" | "task", id: number, date?: string) => void;
}

export function KidStatusItems({
  outstandingChores,
  allIncompleteTasks,
  editingTaskId,
  onEditTask,
  onUpdateTask,
  onDeleteTask,
  onCancelEdit,
  onExcuse,
}: KidStatusItemsProps) {
  const incompleteItems = useMemo(() => {
    const choreSchedules = outstandingChores.map(chore => ({
      id: chore.id,
      chore_id: chore.chore_id,
      kid_name: chore.kid_name,
      day_of_week: ["", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"][
        chore.day_number
      ] as DayOfWeek,
      chore_name: chore.chore_name,
      chore_description: chore.chore_description,
      is_completed: chore.is_completed,
      completed_at: chore.completed_at ? new Date(chore.completed_at) : undefined,
      completion_id: chore.completion_id || undefined,
      created_at: new Date(),
      flexible: chore.flexible ?? true,
      excused: chore.excused ?? false,
      chore_date: chore.chore_date,
      is_late_completion: chore.is_late_completion ?? false,
    }));

    const sortableItems = createSortableItems(choreSchedules, allIncompleteTasks);
    const sortedItems = sortItems(sortableItems);
    // Show incomplete items OR late-completed items (which need attention)
    return sortedItems.filter(item => !item.isCompleted || item.isLateCompletion);
  }, [outstandingChores, allIncompleteTasks]);

  return (
    <>
      {incompleteItems.map(item => {
        if (item.type === "chore") {
          const dayName = item.dayOfWeek ? item.dayOfWeek.charAt(0).toUpperCase() + item.dayOfWeek.slice(1, 3) : "";
          const choreData = item.data as unknown as ChoreWithSchedule & { chore_date?: string };
          const showExcuseButton = item.status === "overdue" || item.isLateCompletion;
          return (
            <div
              key={item.id}
              className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
                item.isLateCompletion
                  ? "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-100"
                  : item.status === "today"
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100"
                    : item.status === "overdue"
                      ? "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-100"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300"
              }`}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.name}</span>
                {item.isFixed && <span title="Fixed - must be done on scheduled day">🔒</span>}
                {onExcuse && showExcuseButton && (
                  <button
                    onClick={() => onExcuse("chore", choreData.id, choreData.chore_date)}
                    className="rounded bg-yellow-500 px-1.5 py-0.5 text-xs font-medium text-white hover:bg-yellow-600"
                    title="Excuse this chore">
                    Excuse
                  </button>
                )}
                {item.isLateCompletion && (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">
                    Late
                  </span>
                )}
              </div>
              <span className="text-xs opacity-75">Chore ({dayName})</span>
            </div>
          );
        } else {
          const task = item.data as Task;

          if (editingTaskId === task.id) {
            return (
              <TaskEditForm
                key={item.id}
                task={task}
                onSave={values => onUpdateTask(task.id, values)}
                onCancel={onCancelEdit}
                onDelete={() => onDeleteTask(task.id)}
              />
            );
          }

          return (
            <div
              key={item.id}
              onClick={() => onEditTask(task.id)}
              className={`flex cursor-pointer items-center justify-between rounded px-2 py-1 text-sm transition-opacity hover:opacity-80 ${
                item.status === "overdue"
                  ? "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-100"
                  : item.status === "today"
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300"
              }`}>
              <span className="font-medium">{item.name}</span>
              <div className="flex items-center gap-2">
                <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  Task ({item.dueDate ? item.dueDate.toLocaleDateString("en-US", { weekday: "short" }) : "unknown"})
                </span>
                {onExcuse && item.status === "overdue" && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onExcuse("task", task.id);
                    }}
                    className="rounded bg-yellow-500 px-1.5 py-0.5 text-xs font-medium text-white hover:bg-yellow-600"
                    title="Excuse this task">
                    Excuse
                  </button>
                )}
              </div>
            </div>
          );
        }
      })}
    </>
  );
}
