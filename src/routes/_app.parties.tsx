import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createParty } from "@/lib/api";

import { useQuery } from "@tanstack/react-query";
import { listParties } from "@/lib/api";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Building2, Plus, Mail, Phone, MoreHorizontal, Edit, Archive } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_app/parties")({
  component: PartiesPage,
});


function AddPartyDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleSave = async () => {
    if (!name || !code) return toast.error("Name and Code are required");
    
    setLoading(true);
    try {
      await createParty({
        name,
        code,
        contact_person: contact,
        email,
        phone,
        status: "Active"
      });
      toast.success("Party added successfully");
      setOpen(false);
      onAdded();
      // Reset form
      setName(""); setCode(""); setContact(""); setEmail(""); setPhone("");
    } catch (err: any) {
      toast.error(err.message || "Failed to add party");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Party
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Party</DialogTitle>
          <DialogDescription>
            Create a new company, supplier, or internal department.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="ABC Engineering" />
            </div>
            <div className="space-y-2">
              <Label>Code / Short Name *</Label>
              <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="ABC" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Contact Person</Label>
            <Input value={contact} onChange={e => setContact(e.target.value)} placeholder="John Doe" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="555-0199" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Add Party"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PartiesPage() {
  const { can } = usePermissions();
  
  const { data: parties, isLoading, refetch } = useQuery({
    queryKey: ["parties-list"],
    queryFn: listParties,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Parties</h2>
          <p className="text-muted-foreground mt-1">
            Manage customers, suppliers, and internal departments.
          </p>
        </div>
        {isSuperAdmin && can("manage_parties") && (
          <AddPartyDialog onAdded={() => refetch()} />
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Party Name / Code</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                  Loading parties...
                </TableCell>
              </TableRow>
            ) : !displayParties || displayParties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Building2 className="w-8 h-8 text-slate-300 mb-2" />
                    <p>No parties found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayParties.map((party) => (
                <TableRow key={party.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="font-medium text-slate-900">{party.name}</div>
                    <div className="text-xs text-slate-500">Code: {party.code}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{party.contact_person || "—"}</div>
                    <div className="flex flex-col gap-1 mt-1 text-xs text-slate-500">
                      {party.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {party.email}
                        </div>
                      )}
                      {party.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {party.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={party.status === "Active" ? "default" : "secondary"}>
                      {party.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {format(new Date(party.created_at), "MMM d, yyyy")}
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
                          <Building2 className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        {isSuperAdmin && can("manage_parties") && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Archive className="mr-2 h-4 w-4" /> Archive
                            </DropdownMenuItem>
                          </>
                        )}
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
