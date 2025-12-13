import { NextResponse } from "next/server";
import {
  getCurrentWeekChores,
  getAllTasks,
  getUniqueKidNames,
  getWeeklyQualification,
  ChoreScheduleWithCompletion,
} from "@/app/lib/db";
import { parseLocalDate } from "@/app/lib/utils";
import { getCurrentDate } from "@/app/lib/time-server";
import { startOfDay, isAfter } from "date-fns";

// Extend the type to include day_number which is returned by the SQL query
interface ChoreWithDayNumber extends ChoreScheduleWithCompletion {
  day_number: number;
}

export async function GET() {
  try {
    // Get all data in parallel
    const [allChoresData, allTasks, kidNames] = await Promise.all([
      getCurrentWeekChores(),
      getAllTasks(),
      getUniqueKidNames(),
    ]);

    // Cast to include day_number which is returned by the SQL query
    const allChores = allChoresData as ChoreWithDayNumber[];

    // Get today's date info
    const today = await getCurrentDate();
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
    const todayStart = startOfDay(today);

    // Build dashboard data for each kid (including qualification status)
    const dashboardData = await Promise.all(
      kidNames.map(async kidName => {
        // Filter chores for this kid
        const kidChores = allChores.filter(chore => chore.kid_name === kidName);

        // Filter tasks for this kid
        const kidTasks = allTasks.filter(task => task.kid_name === kidName);

        // Filter for outstanding items (today or past, not completed)
        const outstandingChores = kidChores.filter(chore => {
          // Only consider chores for today or past days
          if (chore.day_number > dayOfWeek) return false;

          // Check if not completed
          return !chore.is_completed;
        });

        const outstandingTasks = kidTasks.filter(task => {
          // Not completed and due today or in the past
          // due_date is now always a string in YYYY-MM-DD format
          const dueDate = parseLocalDate(task.due_date);
          return !task.completed_at && !task.excused_at && !isAfter(dueDate, todayStart);
        });

        // All incomplete tasks (including future ones) for display in dashboard
        const allIncompleteTasks = kidTasks.filter(task => !task.completed_at && !task.excused_at);

        // Upcoming tasks (future tasks not due yet)
        const upcomingTasks = kidTasks.filter(task => {
          const dueDate = parseLocalDate(task.due_date);
          return !task.completed_at && !task.excused_at && isAfter(dueDate, todayStart);
        });

        // Get qualification status
        const qualification = await getWeeklyQualification(kidName);

        return {
          name: kidName,
          outstandingChores,
          outstandingTasks,
          allIncompleteTasks,
          upcomingTasks,
          allComplete: outstandingChores.length === 0 && outstandingTasks.length === 0,
          qualification,
        };
      })
    );

    // Sort kids: alphabetically by name, but with completed kids at the end
    dashboardData.sort((a, b) => {
      // If one is complete and the other isn't, incomplete comes first
      if (a.allComplete !== b.allComplete) {
        return a.allComplete ? 1 : -1;
      }
      // Otherwise sort alphabetically by name
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ dashboard: dashboardData });
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
