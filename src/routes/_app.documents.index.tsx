import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { listDocuments, listParties } from "@/lib/api";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileText, Search, Plus, FilterX, Eye, Download, History, Shield, Info } from "lucide-react";
import { DOC_STATUSES, DOCUMENT_TYPES } from "@/lib/rbac";

export const Route = createFileRoute("/_app/documents/")({
  component: DocumentsPage,
});

function DocumentsPage() {
  const { can } = usePermissions();
  const navigate = useNavigate();
  
  const [search, setSearch] = useState("");
  const [partyId, setPartyId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [docType, setDocType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: parties } = useQuery({
    queryKey: ["parties-list"],
    queryFn: listParties,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["documents", debouncedSearch, partyId, status, docType, page],
    queryFn: () => listDocuments({
      search: debouncedSearch || undefined,
      partyId: partyId !== "all" ? partyId : undefined,
      status: status !== "all" ? status : undefined,
      documentType: docType !== "all" ? docType : undefined,
      page,
      pageSize,
    }),
  });

  const handleResetFilters = () => {
    setSearch("");
    setPartyId("all");
    setStatus("all");
    setDocType("all");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Documents</h2>
          <p className="text-muted-foreground mt-1">
            Manage engineering drawings, CNC programs, and documents.
          </p>
        </div>
        {can("upload") && (
          <Button onClick={() => navigate({ to: "/upload" })} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by doc number, part, or name..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Select value={partyId} onValueChange={(v) => { setPartyId(v); setPage(1); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Party" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Parties</SelectItem>
              {parties?.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {DOC_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={docType} onValueChange={(v) => { setDocType(v); setPage(1); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {DOCUMENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleResetFilters} className="w-full">
            <FilterX className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Part / Name</TableHead>
              <TableHead>Party</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  Loading documents...
                </TableCell>
              </TableRow>
            ) : !data || data.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <FileText className="w-8 h-8 text-slate-300 mb-2" />
                    <p>No documents found matching your criteria.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.rows.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="font-medium text-indigo-600">{doc.document_number}</div>
                    <div className="text-xs text-slate-500">v{doc.current_version} • {doc.file_type?.toUpperCase()}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-900 truncate max-w-[200px]">{doc.document_name}</div>
                    <div className="text-xs text-slate-500">PN: {doc.part_number}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-700">{doc.parties?.name || "Internal"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={doc.status === "Approved" || doc.status === "Released" ? "default" : doc.status === "Superseded" ? "secondary" : "outline"}>
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-700">{format(new Date(doc.updated_at), "MMM d, yyyy")}</div>
                    <div className="text-xs text-slate-500">{doc.updated_by_name}</div>
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
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate({ to: `/documents/${doc.id}` })}>
                          <Info className="mr-2 h-4 w-4" /> Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate({ to: `/documents/${doc.id}` })}>
                          <History className="mr-2 h-4 w-4" /> Version History
                        </DropdownMenuItem>
                        
                        {can("view") && (
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" /> Preview
                          </DropdownMenuItem>
                        )}
                        
                        {can("download") && (
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" /> Download
                          </DropdownMenuItem>
                        )}
                        
                        {can("manage_access") && (
                          <DropdownMenuItem onClick={() => navigate({ to: `/documents/${doc.id}` })}>
                            <Shield className="mr-2 h-4 w-4" /> Manage Access
                          </DropdownMenuItem>
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

      {data && data.total > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, data.total)} of {data.total} documents
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * pageSize >= data.total}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
