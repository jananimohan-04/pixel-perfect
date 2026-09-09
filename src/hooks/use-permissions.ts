import { useAuth } from "./use-auth";
import { Permission, DOC_PERMISSIONS } from "@/lib/rbac";

export function usePermissions() {
  const { role, profile } = useAuth();

  // If the user has a super admin role (we can check by role code or name)
  // Let's assume Super Admin has all permissions. The system roles are generally 'Super Admin'.
  const isSuperAdmin = role?.name === "Super Admin";

  const can = (permission: Permission) => {
    if (isSuperAdmin) return true;
    if (!role) return false;
    
    // Check if the role permissions array contains the permission key
    const perms = role.permissions as unknown as string[];
    if (!Array.isArray(perms)) return false;
    return perms.includes(permission);
  };

  return { can, isSuperAdmin, role, profile };
}
