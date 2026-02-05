import { NextResponse } from "next/server";
import { getCurrentWeekChores, getTasksForParentView, getUniqueKidNames, getWeeklyQualification } from "@/app/lib/db";

export async function GET() {
  try {
    // Get all data in parallel
    const [allChores, allTasks, kidNames] = await Promise.all([
      getCurrentWeekChores(),
      getTasksForParentView(),
      getUniqueKidNames(),
    ]);

    // Build dashboard data for each kid (full week view, same as kid view)
    const dashboardData = await Promise.all(
      kidNames.map(async kidName => {
        // Filter chores and tasks for this kid (full week, not filtered by date)
        const chores = allChores.filter(chore => chore.kid_name === kidName);
        const tasks = allTasks.filter(task => task.kid_name === kidName);

        // Get qualification status
        const qualification = await getWeeklyQualification(kidName);

        return {
          name: kidName,
          chores,
          tasks,
          qualification,
        };
      })
    );

    // Sort kids alphabetically by name
    dashboardData.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ dashboard: dashboardData });
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
