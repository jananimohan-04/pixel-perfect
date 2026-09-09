import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listProfiles, listUserRoles } from "@/lib/api";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Users, Shield, MoreHorizontal, ShieldOff, Edit } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_app/users")({
  component: UsersPage,
});

function UsersPage() {
  const { can, isSuperAdmin } = usePermissions();

  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["users-list"],
    queryFn: listProfiles,
    enabled: can("manage_users"),
  });

  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ["user-roles-list"],
    queryFn: listUserRoles,
    enabled: can("manage_users"),
  });

  if (!can("manage_users")) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <ShieldOff className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-slate-500 mt-2 max-w-md">
          You do not have permission to view or manage users. Please contact your system administrator if you need access.
        </p>
      </div>
    );
  }

  const isLoading = profilesLoading || rolesLoading;

  const getUserRoleName = (userId: string) => {
    const ur = userRoles?.find(r => r.user_id === userId);
    // Real implementation would join the roles table or we use the data we have
    // The API `listUserRoles` just gets the joining table unless we augment it.
    // Assuming for UI we might need a `listRoles` query as well, but for now we'll fake the display based on role_id if we don't have the full join.
    if (!ur) return "Viewer";
    return "Assigned"; // We need listRoles to map this properly.
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Users</h2>
          <p className="text-muted-foreground mt-1">
            Manage system users, departments, and basic access status.
          </p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          Invite User
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : !profiles || profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="w-8 h-8 text-slate-300 mb-2" />
                    <p>No users found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((profile) => (
                <TableRow key={profile.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="font-medium text-slate-900">{profile.full_name || "Unknown User"}</div>
                    <div className="text-xs text-slate-500">{profile.user_id}</div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-700">
                    {profile.department || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={profile.status === "Active" ? "default" : "secondary"}>
                      {profile.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {format(new Date(profile.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" /> Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="mr-2 h-4 w-4" /> Manage Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className={profile.status === "Active" ? "text-red-600" : "text-green-600"}>
                          <ShieldOff className="mr-2 h-4 w-4" /> 
                          {profile.status === "Active" ? "Disable User" : "Enable User"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
