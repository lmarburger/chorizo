import { NextRequest } from "next/server";
import { getAllFeedback, addFeedback, getIncompleteFeedback, getCompletedFeedback } from "@/app/lib/db";
import { apiError, apiSuccess, validateRequiredFields, handleDbError, parseJsonBody } from "@/app/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get("filter");

    let feedback;
    if (filter === "incomplete") {
      feedback = await getIncompleteFeedback();
    } else if (filter === "completed") {
      feedback = await getCompletedFeedback();
    } else {
      feedback = await getAllFeedback();
    }

    return apiSuccess({ feedback });
  } catch (error) {
    return handleDbError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<{ kid_name: string; message: string }>(request);
    if (!body) {
      return apiError("Invalid JSON body", 400);
    }

    const validationError = validateRequiredFields(body, ["kid_name", "message"]);
    if (validationError) {
      return apiError(validationError, 400);
    }

    const feedback = await addFeedback(body.kid_name, body.message);
    return apiSuccess({ feedback });
  } catch (error) {
    return handleDbError(error);
  }
}
