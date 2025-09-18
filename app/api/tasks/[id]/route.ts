import { updateTask, deleteTask, toggleTaskComplete } from "@/app/lib/db";
import { apiSuccess, handleDbError, parseJsonBody } from "@/app/lib/api-utils";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await parseJsonBody(request);
    if (!body) {
      return handleDbError(new Error("Invalid JSON body"));
    }

    const task = await updateTask(parseInt(id), body);
    return apiSuccess({ task });
  } catch (error) {
    return handleDbError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteTask(parseInt(id));
    return apiSuccess({ success: true });
  } catch (error) {
    return handleDbError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const task = await toggleTaskComplete(parseInt(id));
    return apiSuccess({ task });
  } catch (error) {
    return handleDbError(error);
  }
}
