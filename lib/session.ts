import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  GROUP_HOME,
  db,
  roleGroup,
  type Employee,
  type RoleGroup,
  type RoleKey,
  type User,
} from "./db";
import { getEmployee } from "./queries";

const COOKIE = "aura_session";

interface Raw {
  userId: string;
  role?: RoleKey;
}

/*
 * Demo-grade session: the cookie holds the user id and the active role and is
 * re-validated against the in-memory store on every read. It is not signed, so
 * it must not be used as-is for a real deployment.
 */
export async function writeSession(raw: Raw) {
  (await cookies()).set(COOKIE, JSON.stringify(raw), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export interface Session {
  user: User;
  role?: RoleKey;
}

export async function readSession(): Promise<Session | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return null;
  try {
    const raw = JSON.parse(value) as Raw;
    const user = db().users.find((u) => u.id === raw.userId);
    if (!user) return null;
    const role = raw.role && user.roles.includes(raw.role) ? raw.role : undefined;
    return { user, role };
  } catch {
    return null;
  }
}

export interface Ctx {
  user: User;
  role: RoleKey;
  employee: Employee | undefined;
}

/** Loads the session and enforces that the active role belongs to `group`. */
export async function requireRole(group: RoleGroup): Promise<Ctx> {
  const session = await readSession();
  if (!session) redirect("/login");
  if (!session.role) redirect("/peran");
  if (roleGroup(session.role) !== group) redirect(GROUP_HOME[roleGroup(session.role)]);
  return {
    user: session.user,
    role: session.role,
    employee: getEmployee(session.user.badge),
  };
}

/** For Server Actions: verifies the active role is one of `roles`. */
export async function assertRole(...roles: RoleKey[]): Promise<Ctx> {
  const session = await readSession();
  if (!session?.role || !roles.includes(session.role)) {
    throw new Error("Tidak berwenang melakukan tindakan ini.");
  }
  return {
    user: session.user,
    role: session.role,
    employee: getEmployee(session.user.badge),
  };
}
