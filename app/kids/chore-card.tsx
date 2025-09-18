"use client";

import { ChoreScheduleWithCompletion } from "../lib/db";
import { BaseItemCard } from "../components/base-item-card";
import { DAY_LABELS, DAYS_OF_WEEK, isChoreOverdue, isChoreFuture } from "../lib/utils";

interface ChoreCardProps {
  chore: ChoreScheduleWithCompletion;
  onToggle: () => void;
}

export function ChoreCard({ chore, onToggle }: ChoreCardProps) {
  const isOverdue = isChoreOverdue(chore.day_of_week as (typeof DAYS_OF_WEEK)[number], chore.is_completed);
  const isFuture = isChoreFuture(chore.day_of_week as (typeof DAYS_OF_WEEK)[number]);

  return (
    <BaseItemCard
      id={chore.id}
      title={chore.chore_name}
      description={chore.chore_description}
      dayOrDate={DAY_LABELS[chore.day_of_week as (typeof DAYS_OF_WEEK)[number]]}
      isCompleted={chore.is_completed}
      isOverdue={isOverdue}
      isFuture={isFuture}
      onToggle={onToggle}
      toggleEndpoint="/api/chores/toggle"
      toggleBody={{
        scheduleId: chore.id,
        dayOfWeek: chore.day_of_week,
        isCompleted: chore.is_completed,
      }}
    />
  );
}
