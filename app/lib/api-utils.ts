import { NextResponse } from "next/server";

/**
 * Standard API error response
 */
export function apiError(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Standard API success response
 */
export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Handle common database errors
 */
export function handleDbError(error: unknown): NextResponse {
  console.error("Database error:", error);

  if (error instanceof Error) {
    // Check for common Postgres errors
    if (error.message.includes("duplicate key")) {
      return apiError("This item already exists", 409);
    }
    if (error.message.includes("foreign key")) {
      return apiError("Referenced item does not exist", 400);
    }
    if (error.message.includes("not found")) {
      return apiError("Item not found", 404);
    }
  }

  return apiError("An unexpected error occurred");
}

/**
 * Validate string length, returning error message if too long
 */
export function validateStringLength(value: string, fieldName: string, maxLength: number): string | null {
  if (value.length > maxLength) {
    return `${fieldName} must be ${maxLength} characters or less`;
  }
  return null;
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  body: T,
  requiredFields: (keyof T)[]
): string | null {
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      return `Missing required field: ${String(field)}`;
    }
  }
  return null;
}

/**
 * Parse JSON body safely
 */
export async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
