"use client";

import { useState, useMemo } from "react";
import { createSortableItems, sortItems, SortableItem } from "../lib/sorting";
import { TaskEditForm } from "./task-edit-form";
import type { ChoreScheduleWithCompletion, Task } from "../lib/db";

interface KidStatusItemsProps {
  chores: ChoreScheduleWithCompletion[];
  tasks: Task[];
  editingTaskId: number | null;
  onEditTask: (taskId: number) => void;
  onUpdateTask: (taskId: number, values: { title: string; description: string; due_date: string }) => void;
  onDeleteTask: (taskId: number) => void;
  onCancelEdit: () => void;
  onExcuse?: (type: "chore" | "task", id: number, date?: string) => void;
}

function isItemDisqualifying(item: SortableItem): boolean {
  // Late completion that's not excused
  if (item.isLateCompletion && !item.isExcused) return true;
  // Incomplete fixed chore that's overdue
  if (item.isFixed && item.status === "overdue" && !item.isCompleted) return true;
  // Incomplete task that's overdue
  if (item.type === "task" && item.status === "overdue" && !item.isCompleted) return true;
  return false;
}

function getItemColorClasses(item: SortableItem): string {
  const isDisqualifying = isItemDisqualifying(item);

  // Disqualifying items are red
  if (isDisqualifying) {
    return "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-100";
  }

  // Completed/excused items are green
  if (item.isCompleted || item.isExcused) {
    return "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-100";
  }

  // Overdue flexible chores are yellow (warning, not yet disqualifying)
  if (item.status === "overdue") {
    return "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-100";
  }

  // Today items are blue
  if (item.status === "today") {
    return "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100";
  }

  // Future items are gray
  return "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300";
}

export function KidStatusItems({
  chores,
  tasks,
  editingTaskId,
  onEditTask,
  onUpdateTask,
  onDeleteTask,
  onCancelEdit,
  onExcuse,
}: KidStatusItemsProps) {
  const [showCompleted, setShowCompleted] = useState(false);

  const { visibleItems, collapsedItems } = useMemo(() => {
    const sortableItems = createSortableItems(chores, tasks);
    const sortedItems = sortItems(sortableItems);

    // Separate items into visible (always shown) and collapsed (hidden by default)
    // Disqualifying items are always visible, green completed items are collapsed
    const visible: SortableItem[] = [];
    const collapsed: SortableItem[] = [];

    for (const item of sortedItems) {
      const isDisqualifying = isItemDisqualifying(item);
      const isGreenCompleted = (item.isCompleted || item.isExcused) && !isDisqualifying;

      if (isGreenCompleted) {
        collapsed.push(item);
      } else {
        visible.push(item);
      }
    }

    return { visibleItems: visible, collapsedItems: collapsed };
  }, [chores, tasks]);

  const renderItem = (item: SortableItem) => {
    if (item.type === "chore") {
      const dayName = item.dayOfWeek ? item.dayOfWeek.charAt(0).toUpperCase() + item.dayOfWeek.slice(1, 3) : "";
      const choreData = item.data as ChoreScheduleWithCompletion & { chore_date?: string };
      const isDisqualifying = isItemDisqualifying(item);
      const showExcuseButton = isDisqualifying && !item.isExcused;

      return (
        <div
          key={item.id}
          className={`flex items-center justify-between rounded px-2 py-1 text-sm ${getItemColorClasses(item)}`}>
          <div className="flex items-center gap-2">
            {item.isCompleted && (
              <svg className="h-4 w-4 text-current opacity-60" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
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
            {item.isLateCompletion && !item.isExcused && (
              <span className="rounded-full bg-red-200 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-800 dark:text-red-200">
                Late
              </span>
            )}
            {item.isExcused && (
              <span className="rounded-full bg-green-200 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-200">
                Excused
              </span>
            )}
          </div>
          <span className="text-xs opacity-75">{dayName}</span>
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

      const isDisqualifying = isItemDisqualifying(item);
      const showExcuseButton = isDisqualifying && !item.isExcused;

      return (
        <div
          key={item.id}
          onClick={() => onEditTask(task.id)}
          className={`flex cursor-pointer items-center justify-between rounded px-2 py-1 text-sm transition-opacity hover:opacity-80 ${getItemColorClasses(item)}`}>
          <div className="flex items-center gap-2">
            {item.isCompleted && (
              <svg className="h-4 w-4 text-current opacity-60" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span className="font-medium">{item.name}</span>
            {item.isExcused && (
              <span className="rounded-full bg-green-200 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-200">
                Excused
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-75">
              {item.dueDate ? item.dueDate.toLocaleDateString("en-US", { weekday: "short" }) : ""}
            </span>
            {onExcuse && showExcuseButton && (
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
  };

  return (
    <div className="space-y-1">
      {visibleItems.map(renderItem)}

      {collapsedItems.length > 0 && (
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="flex w-full items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50">
          <svg
            className={`h-3 w-3 transition-transform ${showCompleted ? "rotate-90" : ""}`}
            fill="currentColor"
            viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          {collapsedItems.length} completed
        </button>
      )}

      {showCompleted && collapsedItems.map(renderItem)}
    </div>
  );
}
