import { getTasksForParentView, addTask, getAllTasks } from "@/app/lib/db";
import { apiSuccess, apiError, handleDbError, parseJsonBody } from "@/app/lib/api-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");

    const tasks = view === "parent" ? await getTasksForParentView() : await getAllTasks();
    return apiSuccess({ tasks });
  } catch (error) {
    return handleDbError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<{
      title?: string;
      description?: string;
      kid_name?: string;
      due_date?: string;
    }>(request);

    if (!body) {
      return handleDbError(new Error("Invalid JSON body"));
    }

    // Validate required fields
    if (!body.title || !body.kid_name || !body.due_date) {
      return apiError("Missing required fields: title, kid_name, or due_date", 400);
    }

    const task = await addTask({
      title: body.title,
      description: body.description || null,
      kid_name: body.kid_name,
      due_date: body.due_date,
    });
    return apiSuccess({ task });
  } catch (error) {
    return handleDbError(error);
  }
}
