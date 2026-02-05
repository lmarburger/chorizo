import { updateTask, deleteTask, getTaskById, toggleTaskComplete } from "@/app/lib/db";
import { apiError, apiSuccess, handleDbError, parseJsonBody } from "@/app/lib/api-utils";
import { formatDateString } from "@/app/lib/date-utils";
import { getCurrentDate } from "@/app/lib/time-server";

function parseId(id: string): number | null {
  const parsed = parseInt(id, 10);
  return isNaN(parsed) ? null : parsed;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const taskId = parseId(id);
    if (!taskId) return apiError("Invalid task ID", 400);

    const body = await parseJsonBody(request);
    if (!body) return apiError("Invalid JSON body", 400);

    const task = await updateTask(taskId, body);
    if (!task) return apiError("Task not found", 404);
    return apiSuccess({ task });
  } catch (error) {
    return handleDbError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const taskId = parseId(id);
    if (!taskId) return apiError("Invalid task ID", 400);

    await deleteTask(taskId);
    return apiSuccess({ success: true });
  } catch (error) {
    return handleDbError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const taskId = parseId(id);
    if (!taskId) return apiError("Invalid task ID", 400);

    const currentTask = await getTaskById(taskId);
    if (!currentTask) return apiError("Task not found", 404);

    const completedOn = currentTask.completed_on ? null : formatDateString(await getCurrentDate());
    const task = await toggleTaskComplete(taskId, completedOn);
    if (!task) return apiError("Task not found", 404);
    return apiSuccess({ task });
  } catch (error) {
    return handleDbError(error);
  }
}
