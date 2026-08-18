import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { AuthzError } from "@/lib/authz";
import { ApiError } from "@/lib/errors";

export { ApiError };

/** Returns the current session user, or throws a 401 ApiError. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ApiError("Unauthorized", 401);
  }
  return session.user;
}

/** Wraps an API route handler, converting thrown errors into consistent JSON responses. */
export function withApiError<Args extends unknown[]>(
  fn: (...args: Args) => Promise<NextResponse>,
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: "Validation failed", issues: err.flatten() },
          { status: 422 },
        );
      }
      if (err instanceof AuthzError || err instanceof ApiError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      console.error(err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
