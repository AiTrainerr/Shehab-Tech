import { createClientServer } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"
import { cache } from "react"
import { NextResponse } from "next/server"

export type AppRole = 'ADMIN' | 'SUPER_ADMIN' | 'MODERATOR' | 'MEMBER' | 'QC_REVIEWER';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: AppRole;
  isApproved: boolean;
  canReviewQC: boolean;
  canApproveApplications: boolean;
  moderatorType: string;
  firstName: string;
  lastName: string;
  teamLeaderId: string | null;
  teamRole: string | null;
}

export class AuthError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 401, code: string = "UNAUTHORIZED") {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Retrieves the currently authenticated user from the cryptographically verified
 * Supabase SSR session token, then pulls their authoritative role and permissions
 * directly from PostgreSQL via Prisma.
 *
 * Wrapped in React.cache() to deduplicate DB queries across layout, page, and nested components
 * within the same request lifecycle.
 */
export const getCurrentUser = cache(async (): Promise<AuthenticatedUser | null> => {
  try {
    const supabase = await createClientServer()
    const { data: { user: authUser }, error } = await supabase.auth.getUser()
    if (error || !authUser) return null

    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        role: true,
        isApproved: true,
        canReviewQC: true,
        canApproveApplications: true,
        moderatorType: true,
        firstName: true,
        lastName: true,
        teamLeaderId: true,
        teamRole: true,
      }
    })

    if (!dbUser) return null
    return dbUser as AuthenticatedUser
  } catch (err) {
    return null
  }
})

/**
 * Throws AuthError(401) if no valid authenticated session exists.
 */
export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new AuthError("Authentication required", 401, "UNAUTHORIZED")
  }
  return user
}

/**
 * Throws AuthError(401) if not logged in, or AuthError(403) if the user lacks
 * one of the allowed roles, or if a moderator is not yet approved.
 */
export async function requireRole(allowedRoles: AppRole[]): Promise<AuthenticatedUser> {
  const user = await requireUser()

  if (!allowedRoles.includes(user.role)) {
    throw new AuthError("Forbidden: Insufficient permissions", 403, "FORBIDDEN")
  }

  if (user.role === "MODERATOR" && !user.isApproved) {
    throw new AuthError("Forbidden: Moderator account is pending approval", 403, "MODERATOR_NOT_APPROVED")
  }

  return user
}

/**
 * Safe helper for API routes: converts AuthError to a proper NextResponse with 401/403 status.
 * Usage in Route Handlers:
 *
 * const auth = await requireApiAuth(['ADMIN', 'SUPER_ADMIN']);
 * if ('errorResponse' in auth) return auth.errorResponse;
 * const { user } = auth;
 */
export async function requireApiAuth(allowedRoles?: AppRole[]): Promise<{ user: AuthenticatedUser } | { errorResponse: NextResponse }> {
  try {
    const user = allowedRoles ? await requireRole(allowedRoles) : await requireUser()
    return { user }
  } catch (error: any) {
    if (error instanceof AuthError) {
      return {
        errorResponse: NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode })
      }
    }
    console.error("requireApiAuth internal error:", error)
    return {
      errorResponse: NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
    }
  }
}
