import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { UserCircle, Shield, Settings2, Cloud, AlertCircle, RefreshCw, Check, Loader2, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { session, profile } = useAuth();
  const { can } = usePermissions();
  const navigate = useNavigate();

  // Fetch Parties for Multi-Tenant Drive Connection
  const { data: parties, isLoading: partiesLoading, refetch: refetchParties } = useQuery({
    queryKey: ['settings_parties'],
    queryFn: async () => {
      const { data, error } = await supabase.from("cncvault_parties").select("id, name, drive_email, drive_folder_id").order("name");
      if (error) throw error;
      return data;
    },
    enabled: can("manage_settings")
  });

  const handleConnectDrive = async (partyId: string) => {
    try {
      toast.loading("Getting secure authorization link...");
      const { data, error } = await supabase.functions.invoke(`drive-api/auth-url?partyId=${partyId}`, {
        method: 'GET'
      });
      toast.dismiss();

      if (error) throw error;
      if (!data?.url) throw new Error("No URL returned from server");

      // Open OAuth in new tab
      window.open(data.url, '_blank');
      
      // Let the user know to refresh after connecting
      toast.success("Please authorize Google Drive in the new window, then refresh this page.", { duration: 8000 });
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Failed to initiate Drive connection. Is the Edge Function deployed?");
    }
  };

  if (!session) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h2>
        <p className="text-slate-500 mt-2">Manage your account settings and application preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-slate-100/80 p-1 w-full justify-start overflow-x-auto flex-nowrap rounded-xl border border-slate-200 shadow-sm h-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          {can("manage_settings") && (
            <TabsTrigger value="app">Application Settings</TabsTrigger>
          )}
          {can("manage_settings") && (
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-indigo-500" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your personal profile details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input defaultValue={profile?.full_name || ""} />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input defaultValue={profile?.department || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input defaultValue={session?.user.email || ""} disabled />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-slate-100 bg-slate-50 mt-4 rounded-b-xl px-6 py-4">
              <Button className="bg-indigo-600 hover:bg-indigo-700">Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage your password and security preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 max-w-sm">
                <Label>Current Password</Label>
                <Input type="password" />
              </div>
              <div className="space-y-2 max-w-sm">
                <Label>New Password</Label>
                <Input type="password" />
              </div>
              <div className="space-y-2 max-w-sm">
                <Label>Confirm New Password</Label>
                <Input type="password" />
              </div>
            </CardContent>
            <CardFooter className="border-t border-slate-100 bg-slate-50 mt-4 rounded-b-xl px-6 py-4">
              <Button>Update Password</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {can("manage_settings") && (
          <TabsContent value="app" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-indigo-500" />
                  System Preferences
                </CardTitle>
                <CardDescription>Configure global application settings (Admins only).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Enforce Strict Versioning</h4>
                    <p className="text-sm text-slate-500">Prevent uploads that don't match the standard versioning schema.</p>
                  </div>
                  <Switch checked={true} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Require Approval Workflows</h4>
                    <p className="text-sm text-slate-500">Documents remain in 'Under Review' until explicitly approved.</p>
                  </div>
                  <Switch checked={true} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {can("manage_settings") && (
          <TabsContent value="integrations" className="space-y-6">
            <Card className="shadow-sm border-indigo-100">
              <CardHeader className="bg-indigo-50/50 rounded-t-xl border-b border-indigo-100">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-indigo-900">
                      <Cloud className="w-5 h-5 text-indigo-600" />
                      Google Drive Configuration
                    </CardTitle>
                    <CardDescription className="text-indigo-700/70">
                      Connect Google Drive for each company (Party) to isolate storage.
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetchParties()} disabled={partiesLoading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${partiesLoading ? 'animate-spin' : ''}`} />
                    Refresh Status
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Below are all the registered Companies in the system. Click "Connect Drive" to authorize a specific Google Account.
                  </p>
                  
                  {partiesLoading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                    </div>
                  ) : (
                    <div className="space-y-3 mt-4">
                      {parties?.map(party => (
                        <div key={party.id} className="flex items-center justify-between p-4 bg-slate-50 border rounded-lg hover:border-indigo-200 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded border shadow-sm">
                              <Building className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-800">{party.name}</h4>
                              {party.drive_email ? (
                                <p className="text-sm text-green-600 flex items-center gap-1 font-medium mt-1">
                                  <Check className="w-4 h-4" /> Connected to {party.drive_email}
                                </p>
                              ) : (
                                <p className="text-sm text-slate-500 mt-1">Not Connected</p>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant={party.drive_email ? "outline" : "default"}
                            className={party.drive_email ? "text-slate-600" : "bg-indigo-600 hover:bg-indigo-700"}
                            onClick={() => handleConnectDrive(party.id)}
                          >
                            <Cloud className="w-4 h-4 mr-2" /> 
                            {party.drive_email ? "Reconnect Drive" : "Connect Drive"}
                          </Button>
                        </div>
                      ))}
                      
                      {parties?.length === 0 && (
                        <div className="text-center p-6 text-slate-500 border border-dashed rounded-lg">
                          No companies found. Add a Party first.
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    <AlertCircle className="w-5 h-5 inline mr-2 -mt-0.5" />
                    <strong>Note:</strong> The Google Drive Edge Function must be deployed to your Supabase project before the Connect buttons will work. Run <code>npx supabase functions deploy drive-api</code> in your terminal.
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
