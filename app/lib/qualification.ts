// Pure qualification logic - no I/O, fully testable

export type RewardType = "screen_time" | "money";

export interface IncentiveClaim {
  id: number;
  kid_name: string;
  week_start_date: string;
  reward_type: RewardType;
  claimed_at: Date;
  dismissed_at: Date | null;
}

export interface MissedItem {
  type: "chore" | "task";
  id: number;
  name: string;
  scheduledDate: string;
  kidName: string;
}

export interface QualificationStatus {
  qualified: boolean;
  disqualified: boolean;
  inProgress: boolean;
  missedItems: MissedItem[];
  claim: IncentiveClaim | null;
}

export interface ChoreRow {
  schedule_id: number;
  chore_name: string;
  flexible: boolean;
  scheduled_date: string;
  completion_id: number | null;
  excused: boolean | null;
  is_late_completion: boolean;
}

export interface TaskRow {
  id: number;
  title: string;
  due_date: string;
  completed_at: string | null;
  excused_at: string | null;
}

export interface QualificationInput {
  kidName: string;
  chores: ChoreRow[];
  tasks: TaskRow[];
  today: string; // YYYY-MM-DD
  fridayStr: string; // YYYY-MM-DD, end of work week
  existingClaim: IncentiveClaim | null;
}

export function calculateQualification(input: QualificationInput): QualificationStatus {
  const { kidName, chores, tasks, today, fridayStr, existingClaim } = input;

  const missedItems: MissedItem[] = [];
  let isDisqualified = false;

  // Check fixed chores - must be done on their scheduled day
  for (const chore of chores) {
    if (chore.flexible) continue;
    const scheduledDate = chore.scheduled_date;
    const isPast = scheduledDate < today;
    const isCompleted = chore.completion_id !== null && !chore.excused;
    const isExcused = chore.excused === true;
    const isLateCompletion = chore.is_late_completion === true;

    // Disqualify if: missed (past and not completed) OR completed late (unless excused)
    if ((isPast && !isCompleted && !isExcused) || (isLateCompletion && !isExcused)) {
      isDisqualified = true;
      missedItems.push({
        type: "chore",
        id: chore.schedule_id,
        name: chore.chore_name,
        scheduledDate: scheduledDate,
        kidName: kidName,
      });
    }
  }

  // Check flexible chores - can be done any day, check at end of Friday
  const isFridayOrLater = today >= fridayStr;
  if (isFridayOrLater) {
    for (const chore of chores) {
      if (!chore.flexible) continue;
      const isCompleted = chore.completion_id !== null && !chore.excused;
      const isExcused = chore.excused === true;

      if (!isCompleted && !isExcused) {
        isDisqualified = true;
        missedItems.push({
          type: "chore",
          id: chore.schedule_id,
          name: chore.chore_name,
          scheduledDate: chore.scheduled_date,
          kidName: kidName,
        });
      }
    }
  }

  // Check tasks - must be done by due date
  for (const task of tasks) {
    const dueDate = task.due_date;
    const isPast = dueDate < today;
    const isCompleted = task.completed_at !== null;
    const isExcused = task.excused_at !== null;

    if (isPast && !isCompleted && !isExcused) {
      isDisqualified = true;
      missedItems.push({
        type: "task",
        id: task.id,
        name: task.title,
        scheduledDate: dueDate,
        kidName: kidName,
      });
    }
  }

  // Calculate if all items are complete (qualified)
  const allChoresComplete = chores.every(c => c.completion_id !== null || c.excused === true);
  const allTasksComplete = tasks.every(t => t.completed_at !== null || t.excused_at !== null);
  const isQualified = !isDisqualified && allChoresComplete && allTasksComplete;
  const inProgress = !isDisqualified && !isQualified;

  return {
    qualified: isQualified,
    disqualified: isDisqualified,
    inProgress,
    missedItems,
    claim: existingClaim,
  };
}
