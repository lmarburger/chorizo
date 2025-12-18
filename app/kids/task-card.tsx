"use client";

import { Task } from "../lib/db";
import { BaseItemCard } from "../components/base-item-card";
import { getDaysUntilDue } from "../lib/utils";

interface TaskCardProps {
  task: Task;
  onToggle: () => void;
}

export function TaskCard({ task, onToggle }: TaskCardProps) {
  const daysUntil = getDaysUntilDue(task.due_date);
  const isOverdue = daysUntil < 0 && !task.completed_on;
  const isFuture = daysUntil > 0 && !task.completed_on;

  // Tasks are disqualifying if overdue and incomplete (not excused)
  const isDisqualifying = isOverdue && !task.excused;

  return (
    <BaseItemCard
      id={task.id}
      title={task.title}
      description={task.description}
      dayOrDate={task.due_date}
      isCompleted={!!task.completed_on}
      isOverdue={isOverdue}
      isFuture={isFuture}
      isExcused={task.excused}
      isDisqualifying={isDisqualifying}
      onToggle={onToggle}
      toggleEndpoint={`/api/tasks/${task.id}`}
      toggleBody={{}}
    />
  );
}
