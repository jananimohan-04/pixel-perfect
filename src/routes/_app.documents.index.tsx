import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
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
import { Building, MoreHorizontal, FileText, Search, Plus, FilterX, Eye, Download, History, Shield, Info, Folder, LayoutGrid, List, ChevronDown, ChevronRight, FolderOpen } from "lucide-react";
import { GoogleDriveService, DriveFolder } from "@/services/google-drive";
import { DOC_STATUSES, DOCUMENT_TYPES } from "@/lib/rbac";

export const Route = createFileRoute("/_app/documents/")({
  component: DocumentsPage,
});


  const toggleFolderExpand = (id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: prev[id] === undefined ? false : !prev[id] }));
  };


function DocumentRow({ doc, can, navigate }: { doc: any; can: any; navigate: any }) {
  return (
    <TableRow key={doc.id} className="hover:bg-slate-50">
      <TableCell>
        <div className="font-medium text-indigo-600">{doc.document_number}</div>
        <div className="text-xs text-slate-500">v{doc.current_version} | {doc.file_type?.toUpperCase()}</div>
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
  );
}

function DocumentsPage() {
  const { can, isSuperAdmin, isCompanyAdmin, isNormalUser, userPartyId, profile } = usePermissions();
  const navigate = useNavigate();
  
  const [search, setSearch] = useState("");
  const [partyId, setPartyId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [docType, setDocType] = useState<string>("all");
  const [folderId, setFolderId] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "folders">("folders");
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolderExpand = (id: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  const [page, setPage] = useState(1);

  const handlePreview = (fileId: string, docId: string) => {
    toast.loading("Loading preview...");
    GoogleDriveService.getViewUrl(fileId, docId)
      .then(url => {
        toast.dismiss();
        window.open(url, '_blank');
      })
      .catch(e => {
        toast.dismiss();
        toast.error(e.message || "Failed to preview file");
      });
  };

  const handleDownload = (fileId: string, docId: string, fileName: string) => {
    toast.loading("Downloading file...");
    GoogleDriveService.downloadFile(fileId, docId, fileName)
      .then(() => toast.dismiss())
      .catch(e => {
        toast.dismiss();
        toast.error(e.message || "Failed to download file");
      });
  };

  const pageSize = 12;

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const effectivePartyId = partyId !== "all" ? partyId : undefined;

  const { data: parties } = useQuery({
    queryKey: ["parties-list"],
    queryFn: listParties,
  });

  const { data: partyFolders } = useQuery({
    queryKey: ["drive_folders", effectivePartyId],
    queryFn: () => GoogleDriveService.listFolders(effectivePartyId!),
    enabled: !!effectivePartyId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["documents", debouncedSearch, effectivePartyId, folderId, status, docType, page, viewMode],
    queryFn: () => listDocuments({
      search: debouncedSearch || undefined,
      partyId: effectivePartyId,
      folderId: folderId !== "all" ? folderId : undefined,
      status: status !== "all" ? status : undefined,
      documentType: docType !== "all" ? docType : undefined,
      page: viewMode === "list" ? page : 1,
      pageSize: viewMode === "list" ? pageSize : 100,
    }),
  });

  const filteredRows = useMemo(() => {
    if (!data?.rows) return [];
    if (isSuperAdmin || isCompanyAdmin) return data.rows;
    // Normal dept user (Viewer / Engineer): see company documents that are Approved, Released, or created by them
    return data.rows.filter(doc => 
      doc.status === "Approved" || 
      doc.status === "Released" || 
      doc.updated_by_name === profile?.full_name
    );
  }, [data, isSuperAdmin, isCompanyAdmin, profile]);

  const handleResetFilters = () => {
    setSearch("");
    setPartyId("all");
    setFolderId("all");
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
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-lg border flex items-center gap-1">
            <Button
              size="sm"
              variant={viewMode === "folders" ? "secondary" : "ghost"}
              className={`h-8 text-xs font-medium ${viewMode === "folders" ? "bg-white shadow-sm text-indigo-600" : "text-slate-600"}`}
              onClick={() => setViewMode("folders")}
            >
              <Folder className="w-3.5 h-3.5 mr-1.5" />
              Folder View
            </Button>
            <Button
              size="sm"
              variant={viewMode === "list" ? "secondary" : "ghost"}
              className={`h-8 text-xs font-medium ${viewMode === "list" ? "bg-white shadow-sm text-indigo-600" : "text-slate-600"}`}
              onClick={() => setViewMode("list")}
            >
              <List className="w-3.5 h-3.5 mr-1.5" />
              List View
            </Button>
          </div>

          {can("upload") && (
            <Button onClick={() => navigate({ to: "/upload" })} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          )}
        </div>
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
          <Select value={partyId} onValueChange={(v) => { setPartyId(v); setFolderId("all"); setPage(1); }}>
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

          {partyId !== "all" && (
            <Select value={folderId} onValueChange={(v) => { setFolderId(v); setPage(1); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Drive Folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Folders</SelectItem>
                <SelectItem value="root">CNC Vault (Root)</SelectItem>
                {partyFolders?.map((f) => (
                  <SelectItem key={f.id} value={f.google_folder_id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

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

      {/* Full Google Drive Tree Explorer View */}
      {viewMode === "folders" ? (
        <div className="space-y-6">
          {isLoading ? (
            <div className="bg-white p-8 rounded-lg border text-center text-slate-500">Loading Google Drive structure...</div>
          ) : !data || filteredRows.length === 0 ? (
            <div className="bg-white p-8 rounded-lg border text-center text-slate-500">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p>No documents found matching your criteria.</p>
            </div>
          ) : (
            (() => {
              // Group documents by Party first
              const partyMap: Record<string, { partyInfo: any; docs: any[] }> = {};
              
              filteredRows.forEach(doc => {
                const pId = doc.party_id || 'internal';
                if (!partyMap[pId]) {
                  partyMap[pId] = {
                    partyInfo: doc.parties || { id: 'internal', name: 'Internal / CNC Vault', drive_email: null },
                    docs: []
                  };
                }
                partyMap[pId].docs.push(doc);
              });

              return Object.values(partyMap).map(({ partyInfo, docs: partyDocs }) => {
                // Group party documents by Folder ID
                const folderMap: Record<string, any[]> = {};
                partyDocs.forEach(doc => {
                  const fKey = doc.drive_folder_id || 'root';
                  if (!folderMap[fKey]) folderMap[fKey] = [];
                  folderMap[fKey].push(doc);
                });

                const folderEntries: { id: string; name: string; docs: any[] }[] = [
                  { id: 'root', name: 'CNC Vault (Root Folder)', docs: folderMap['root'] || [] }
                ];

                // Add custom folders if available
                partyFolders?.forEach(f => {
                  if (f.party_id === partyInfo.id || partyId !== 'all') {
                    folderEntries.push({
                      id: f.google_folder_id,
                      name: f.name,
                      docs: folderMap[f.google_folder_id] || []
                    });
                  }
                });

                // Add any remaining folder IDs with documents
                Object.keys(folderMap).forEach(k => {
                  if (k !== 'root' && !folderEntries.some(e => e.id === k)) {
                    folderEntries.push({
                      id: k,
                      name: `Folder (${k.substring(0, 8)}...)`,
                      docs: folderMap[k]
                    });
                  }
                });

                return (
                  <div key={partyInfo.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    {/* Party / Company Header */}
                    <div className="bg-slate-100/90 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Building className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-slate-900 text-base">{partyInfo.name}</h3>
                        {partyInfo.drive_email && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs font-normal">
                            ✓ Google Drive Connected
                          </Badge>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs font-medium">
                        {partyDocs.length} {partyDocs.length === 1 ? 'document' : 'documents'}
                      </Badge>
                    </div>

                    {/* Folders List */}
                    <div className="p-4 space-y-3 bg-slate-50/50">
                      {folderEntries.map(folder => {
                        const isExpanded = !!expandedFolders[folder.id];
                        return (
                          <div key={folder.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                            {/* Folder Title Bar */}
                            <div 
                              className="p-3 bg-slate-50 hover:bg-slate-100/80 cursor-pointer flex items-center justify-between transition-colors border-b border-slate-100"
                              onClick={() => toggleFolderExpand(folder.id)}
                            >
                              <div className="flex items-center gap-2.5">
                                {isExpanded ? <FolderOpen className="w-4 h-4 text-amber-500 fill-amber-100" /> : <Folder className="w-4 h-4 text-amber-500 fill-amber-100" />}
                                <span className="font-semibold text-slate-800 text-sm">{folder.name}</span>
                                <Badge variant="outline" className="text-[11px] font-normal text-slate-600 bg-white">
                                  {folder.docs.length} {folder.docs.length === 1 ? 'document' : 'documents'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-slate-400">
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </div>
                            </div>

                            {/* Documents inside Folder */}
                            {isExpanded && (
                              <div className="divide-y divide-slate-100">
                                {folder.docs.length === 0 ? (
                                  <div className="p-3 text-center text-xs text-slate-400 italic">
                                    No documents stored in this folder yet.
                                  </div>
                                ) : (
                                  folder.docs.map(doc => (
                                    <div key={doc.id} className="p-3.5 space-y-2 hover:bg-slate-50/80 transition-colors">
                                      {/* Document Main Info */}
                                      <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2.5">
                                          <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                                          <div>
                                            <span className="font-bold text-indigo-600 text-sm">{doc.document_number}</span>
                                            <span className="text-slate-800 text-sm font-medium ml-2">— {doc.document_name}</span>
                                            {doc.part_number && <span className="text-xs text-slate-500 ml-2">(PN: {doc.part_number})</span>}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge variant={doc.status === "Approved" || doc.status === "Released" ? "default" : "outline"} className="text-xs">
                                            {doc.status}
                                          </Badge>
                                          <Button size="sm" variant="ghost" className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2" onClick={() => navigate({ to: `/documents/${doc.id}` })}>
                                            <Info className="w-3.5 h-3.5 mr-1" /> View Details
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Version Files inside Document */}
                                      {doc.versions && doc.versions.length > 0 && (
                                        <div className="ml-6 pt-1 space-y-1 border-l-2 border-indigo-100 pl-3">
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                            Google Drive Files & Revisions ({doc.versions.length}):
                                          </p>
                                          {doc.versions.sort((a: any, b: any) => b.version_number - a.version_number).map((ver: any) => (
                                            <div key={ver.id} className="flex items-center justify-between py-1.5 px-3 bg-slate-50 rounded border border-slate-200/80 text-xs hover:border-indigo-200 transition-colors">
                                              <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white font-mono text-indigo-700 border-indigo-200">
                                                  V{ver.version_number}
                                                </Badge>
                                                <span className="font-semibold text-slate-800">{ver.file_name}</span>
                                                <span className="text-slate-400 text-[11px]">({ver.file_type?.toUpperCase()})</span>
                                                <span className="text-slate-400 text-[11px]">• Uploaded by {ver.uploaded_by_name || 'User'}</span>
                                              </div>

                                              <div className="flex items-center gap-1">
                                                {ver.google_drive_file_id && can("view") && (
                                                  <Button size="sm" variant="ghost" className="h-6 text-[11px] px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={() => handlePreview(ver.google_drive_file_id, doc.id)}>
                                                    <Eye className="w-3 h-3 mr-1" /> Preview
                                                  </Button>
                                                )}
                                                {ver.google_drive_file_id && can("download") && (
                                                  <Button size="sm" variant="ghost" className="h-6 text-[11px] px-2 text-slate-700 hover:bg-slate-200" onClick={() => handleDownload(ver.google_drive_file_id, doc.id, ver.file_name)}>
                                                    <Download className="w-3 h-3 mr-1" /> Download
                                                  </Button>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>
      ) : (
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
              ) : !data || filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="w-8 h-8 text-slate-300 mb-2" />
                      <p>No documents found matching your criteria.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((doc) => (
                  <DocumentRow key={doc.id} doc={doc} can={can} navigate={navigate} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

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
