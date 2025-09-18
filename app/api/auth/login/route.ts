import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createToken, setAuthCookie } from "@/app/lib/auth";

// Simple in-memory rate limiting
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function getRateLimitKey(request: NextRequest): string {
  // Use IP address for rate limiting
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";
  return ip;
}

function checkRateLimit(key: string): { allowed: boolean; remainingAttempts?: number } {
  const now = Date.now();
  const record = loginAttempts.get(key);

  // Clean up old records
  if (record && now > record.resetTime) {
    loginAttempts.delete(key);
  }

  // Check if currently locked out
  if (record && record.count >= MAX_ATTEMPTS && now < record.resetTime) {
    return { allowed: false };
  }

  // Get current attempt count
  const currentAttempts = record?.count || 0;
  const remainingAttempts = MAX_ATTEMPTS - currentAttempts;

  return { allowed: true, remainingAttempts };
}

function recordAttempt(key: string): void {
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, resetTime: now + LOCKOUT_DURATION };

  record.count++;
  if (record.count >= MAX_ATTEMPTS) {
    record.resetTime = now + LOCKOUT_DURATION;
  }

  loginAttempts.set(key, record);
}

function clearAttempts(key: string): void {
  loginAttempts.delete(key);
}

export async function POST(request: NextRequest) {
  const rateLimitKey = getRateLimitKey(request);
  const { allowed, remainingAttempts } = checkRateLimit(rateLimitKey);

  if (!allowed) {
    return NextResponse.json({ error: "Too many login attempts. Please try again in 15 minutes." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    // Get the hashed family password from environment variable
    // Try base64 encoded version first (to avoid shell escaping issues)
    let hashedFamilyPassword = process.env.FAMILY_PASSWORD_HASH_B64;
    if (hashedFamilyPassword) {
      hashedFamilyPassword = Buffer.from(hashedFamilyPassword, "base64").toString("utf-8");
    } else {
      // Fallback to direct hash for backwards compatibility
      hashedFamilyPassword = process.env.FAMILY_PASSWORD_HASH;
    }

    if (!hashedFamilyPassword) {
      console.error("FAMILY_PASSWORD_HASH not configured");
      return NextResponse.json({ error: "Authentication not configured" }, { status: 500 });
    }

    // Verify the password
    const isValid = await verifyPassword(password, hashedFamilyPassword);

    if (!isValid) {
      recordAttempt(rateLimitKey);
      return NextResponse.json(
        {
          error: "Invalid password",
          remainingAttempts: Math.max(0, (remainingAttempts || MAX_ATTEMPTS) - 1),
        },
        { status: 401 }
      );
    }

    // Clear rate limit on successful login
    clearAttempts(rateLimitKey);

    // Create and set auth token
    const token = await createToken();
    await setAuthCookie(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
