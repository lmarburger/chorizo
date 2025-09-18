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
  const isOverdue = daysUntil < 0 && !task.completed_at;
  const isFuture = daysUntil > 0 && !task.completed_at;

  return (
    <BaseItemCard
      id={task.id}
      title={task.title}
      description={task.description}
      dayOrDate={task.due_date}
      isCompleted={!!task.completed_at}
      completedAt={task.completed_at ? new Date(task.completed_at) : null}
      isOverdue={isOverdue}
      isFuture={isFuture}
      onToggle={onToggle}
      toggleEndpoint={`/api/tasks/${task.id}`}
      toggleBody={{}}
    />
  );
}
