export type LoginPortal = "admin" | "hr" | "employee";

export const PORTAL_CONFIG: Record<
  LoginPortal,
  { title: string; subtitle: string; allowedRoles: string[]; dashboard: string }
> = {
  admin: {
    title: "Company Owner Sign In",
    subtitle: "Sign in to manage your company, HR team, and employees",
    allowedRoles: ["admin"],
    dashboard: "/admin",
  },
  hr: {
    title: "HR Sign In",
    subtitle: "Sign in to manage appraisal cycles and employee reviews",
    allowedRoles: ["hr", "admin"],
    dashboard: "/hr",
  },
  employee: {
    title: "Employee Sign In",
    subtitle: "Sign in to complete self-appraisals, reviews, and meetings",
    allowedRoles: ["employee", "hr", "admin"],
    dashboard: "/employee",
  },
};

export function isValidPortal(portal: string | undefined): portal is LoginPortal {
  return portal === "admin" || portal === "hr" || portal === "employee";
}

export function roleMatchesPortal(role: string, portal: LoginPortal): boolean {
  return PORTAL_CONFIG[portal].allowedRoles.includes(role);
}

export function getDashboardForRole(role: string): string {
  if (role === "admin") return "/admin";
  if (role === "hr") return "/hr";
  return "/employee";
}
