import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createPart } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useQuery } from "@tanstack/react-query";
import { listParts, listParties } from "@/lib/api";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Box, Plus, Search, FilterX, MoreHorizontal, FileText, Info } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_app/parts")({
  component: PartsPage,
});


function AddPartDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [partNumber, setPartNumber] = useState("");
  const [partName, setPartName] = useState("");
  const [drawingNumber, setDrawingNumber] = useState("");
  const [partyId, setPartyId] = useState("");

  const { data: parties } = useQuery({
    queryKey: ["parties-list-for-parts"],
    queryFn: listParties,
  });

  const handleSave = async () => {
    if (!partNumber || !partName) return toast.error("Part Number and Name are required");
    
    setLoading(true);
    try {
      await createPart({
        part_number: partNumber,
        part_name: partName,
        drawing_number: drawingNumber || null,
        party_id: partyId || null
      });
      toast.success("Part added successfully");
      setOpen(false);
      onAdded();
      setPartNumber(""); setPartName(""); setDrawingNumber(""); setPartyId("");
    } catch (err: any) {
      toast.error(err.message || "Failed to add part");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Part
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Part</DialogTitle>
          <DialogDescription>
            Register a new manufactured part or assembly.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Part Number *</Label>
              <Input value={partNumber} onChange={e => setPartNumber(e.target.value)} placeholder="CNC-1001" />
            </div>
            <div className="space-y-2">
              <Label>Part Name *</Label>
              <Input value={partName} onChange={e => setPartName(e.target.value)} placeholder="Widget Assembly" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Drawing Number (Optional)</Label>
            <Input value={drawingNumber} onChange={e => setDrawingNumber(e.target.value)} placeholder="DRG-1001" />
          </div>
          <div className="space-y-2">
            <Label>Assign to Party (Optional)</Label>
            <Select value={partyId} onValueChange={setPartyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a customer/party..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">None (Internal Part)</SelectItem>
                {parties?.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Add Part"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PartsPage() {
  const { can, isSuperAdmin, userPartyId } = usePermissions();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [partyId, setPartyId] = useState<string>("all");

  const effectivePartyId = isSuperAdmin ? (partyId !== "all" ? partyId : undefined) : (userPartyId || undefined);

  const { data: parties } = useQuery({
    queryKey: ["parties-list"],
    queryFn: listParties,
  });

  const { data: parts, isLoading, refetch } = useQuery({
    queryKey: ["parts-list", effectivePartyId],
    queryFn: () => listParts(effectivePartyId),
  });

  const filteredParts = parts?.filter(p => 
    !search || 
    p.part_number.toLowerCase().includes(search.toLowerCase()) || 
    (p.part_name && p.part_name.toLowerCase().includes(search.toLowerCase())) ||
    (p.drawing_number && p.drawing_number.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Parts & Drawings</h2>
          <p className="text-muted-foreground mt-1">
            Manage engineering parts and associated drawings.
          </p>
        </div>
        {can("manage_documents") && (
          <AddPartDialog onAdded={() => refetch()} />
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search parts by number, name, drawing..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:w-auto">
          {isSuperAdmin ? (
            <Select value={partyId} onValueChange={setPartyId}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Party" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Parties</SelectItem>
                {parties?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-md text-xs font-semibold text-indigo-800">
              <span className="truncate">{parties?.find(p => p.id === userPartyId)?.name || "My Company"}</span>
            </div>
          )}

          <Button variant="outline" onClick={() => { setSearch(""); setPartyId("all"); }} className="w-full">
            <FilterX className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Part Number / Name</TableHead>
              <TableHead>Drawing Number</TableHead>
              <TableHead>Party</TableHead>
              <TableHead>Current Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  Loading parts...
                </TableCell>
              </TableRow>
            ) : !filteredParts || filteredParts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Box className="w-8 h-8 text-slate-300 mb-2" />
                    <p>No parts found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredParts.map((part) => (
                <TableRow key={part.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="font-medium text-slate-900">{part.part_number}</div>
                    <div className="text-sm text-slate-500 truncate max-w-[200px]">{part.part_name || "—"}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{part.drawing_number || "—"}</div>
                    {part.drawing_type && <div className="text-xs text-slate-500">{part.drawing_type}</div>}
                  </TableCell>
                  <TableCell className="text-sm text-slate-700">
                    {part.parties?.name || "Internal"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-slate-300">
                      V{part.current_version}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={part.status === "Active" ? "default" : "secondary"}>
                      {part.status}
                    </Badge>
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
                        <DropdownMenuItem onClick={() => toast.info("Part Details page coming soon!")}>
                          <Info className="mr-2 h-4 w-4" /> Part Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate({ to: '/documents' })}>
                          <FileText className="mr-2 h-4 w-4" /> Related Documents
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
