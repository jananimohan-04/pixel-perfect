import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { DocStatus } from "./rbac";

type Tables = Database["public"]["Tables"];
export type Party = Tables["parties"]["Row"];
export type Part = Tables["parts"]["Row"];
export type DocumentRow = Tables["documents"]["Row"];
export type DocumentVersion = Tables["document_versions"]["Row"];
export type DocumentPermission = Tables["document_permissions"]["Row"];
export type Profile = Tables["profiles"]["Row"];
export type Role = Tables["roles"]["Row"];
export type UserRole = Tables["user_roles"]["Row"];
export type AuditLog = Tables["audit_logs"]["Row"];
export type Notification = Tables["notifications"]["Row"];

export type DocumentWithParty = DocumentRow & {
  parties: Pick<Party, "id" | "name" | "code"> | null;
};

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

/* ------------------------------ parties ------------------------------ */

export async function listParties() {
  return unwrap(await supabase.from("parties").select("*").order("name"));
}

export async function getParty(id: string) {
  return unwrap(await supabase.from("parties").select("*").eq("id", id).maybeSingle());
}

export async function createParty(input: Tables["parties"]["Insert"]) {
  return unwrap(await supabase.from("parties").insert(input).select().single());
}

export async function updateParty(id: string, input: Tables["parties"]["Update"]) {
  return unwrap(await supabase.from("parties").update(input).eq("id", id).select().single());
}

/* ------------------------------- parts ------------------------------- */

export async function listParts(partyId?: string) {
  let query = supabase
    .from("parts")
    .select("*, parties(id, name, code)")
    .order("updated_at", { ascending: false });
  if (partyId) query = query.eq("party_id", partyId);
  return unwrap(await query) as (Part & { parties: Pick<Party, "id" | "name" | "code"> | null })[];
}

export async function getPart(id: string) {
  return unwrap(
    await supabase.from("parts").select("*, parties(id, name, code)").eq("id", id).maybeSingle(),
  );
}

export async function createPart(input: Tables["parts"]["Insert"]) {
  return unwrap(await supabase.from("parts").insert(input).select().single());
}

export async function updatePart(id: string, input: Tables["parts"]["Update"]) {
  return unwrap(await supabase.from("parts").update(input).eq("id", id).select().single());
}

/* ----------------------------- documents ----------------------------- */

export type DocumentFilters = {
  search?: string;
  partyId?: string;
  documentType?: string;
  status?: string;
  version?: string;
  updatedBy?: string;
  from?: string;
  to?: string;
  sort?: "updated" | "party" | "number" | "version";
  page?: number;
  pageSize?: number;
};

export async function listDocuments(filters: DocumentFilters = {}) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 12;
  let query = supabase
    .from("documents")
    .select("*, parties(id, name, code)", { count: "exact" });

  if (filters.search) {
    const q = `%${filters.search.trim().replace(/\s+/g, "%")}%`;
    query = query.or(
      `document_number.ilike.${q},part_number.ilike.${q},document_name.ilike.${q},drawing_number.ilike.${q}`,
    );
  }
  if (filters.partyId) query = query.eq("party_id", filters.partyId);
  if (filters.documentType) query = query.eq("document_type", filters.documentType);
  if (filters.status) query = query.eq("status", filters.status as DocStatus);
  if (filters.version) query = query.eq("current_version", Number(filters.version));
  if (filters.updatedBy) query = query.ilike("updated_by_name", `%${filters.updatedBy}%`);
  if (filters.from) query = query.gte("updated_at", filters.from);
  if (filters.to) query = query.lte("updated_at", filters.to);

  switch (filters.sort) {
    case "party":
      query = query.order("party_id");
      break;
    case "number":
      query = query.order("document_number");
      break;
    case "version":
      query = query.order("current_version", { ascending: false });
      break;
    default:
      query = query.order("updated_at", { ascending: false });
  }

  const { data, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as DocumentWithParty[], total: count ?? 0, page, pageSize };
}

export async function getDocument(id: string) {
  return unwrap(
    await supabase
      .from("documents")
      .select("*, parties(id, name, code), parts(id, part_number, part_name, drawing_type)")
      .eq("id", id)
      .maybeSingle(),
  );
}

export async function findDocumentByNumber(documentNumber: string) {
  return unwrap(
    await supabase
      .from("documents")
      .select("*, parties(id, name, code)")
      .eq("document_number", documentNumber)
      .maybeSingle(),
  );
}

export async function createDocument(input: Tables["documents"]["Insert"]) {
  return unwrap(await supabase.from("documents").insert(input).select().single());
}

export async function updateDocument(id: string, input: Tables["documents"]["Update"]) {
  return unwrap(await supabase.from("documents").update(input).eq("id", id).select().single());
}

export async function deleteDocument(id: string) {
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ----------------------------- versions ------------------------------ */

export async function listVersions(documentId: string) {
  return unwrap(
    await supabase
      .from("document_versions")
      .select("*")
      .eq("document_id", documentId)
      .order("version_number", { ascending: false }),
  );
}

export async function createVersion(input: Tables["document_versions"]["Insert"]) {
  return unwrap(await supabase.from("document_versions").insert(input).select().single());
}

export async function supersedeOlderVersions(documentId: string, currentVersion: number) {
  const { error } = await supabase
    .from("document_versions")
    .update({ status: "Superseded" })
    .eq("document_id", documentId)
    .lt("version_number", currentVersion);
  if (error) throw new Error(error.message);
}

export async function updateVersionStatus(id: string, status: DocStatus) {
  return unwrap(
    await supabase.from("document_versions").update({ status }).eq("id", id).select().single(),
  );
}

/* -------------------------- document access -------------------------- */

export async function listDocumentPermissions(documentId: string) {
  return unwrap(
    await supabase.from("document_permissions").select("*").eq("document_id", documentId),
  );
}

export async function replaceDocumentPermissions(
  documentId: string,
  rows: Tables["document_permissions"]["Insert"][],
) {
  const { error } = await supabase
    .from("document_permissions")
    .delete()
    .eq("document_id", documentId);
  if (error) throw new Error(error.message);
  if (rows.length === 0) return;
  const insert = await supabase.from("document_permissions").insert(rows);
  if (insert.error) throw new Error(insert.error.message);
}

/* -------------------------- users and roles -------------------------- */

export async function listProfiles() {
  return unwrap(await supabase.from("profiles").select("*").order("full_name"));
}

export async function listRoles() {
  return unwrap(await supabase.from("roles").select("*").order("is_system", { ascending: false }));
}

export async function listUserRoles() {
  return unwrap(await supabase.from("user_roles").select("*"));
}

export async function setUserRole(userId: string, roleId: string) {
  const del = await supabase.from("user_roles").delete().eq("user_id", userId);
  if (del.error) throw new Error(del.error.message);
  const ins = await supabase.from("user_roles").insert({ user_id: userId, role_id: roleId });
  if (ins.error) throw new Error(ins.error.message);
}

export async function updateProfile(userId: string, input: Tables["profiles"]["Update"]) {
  return unwrap(
    await supabase.from("profiles").update(input).eq("user_id", userId).select().single(),
  );
}

export async function createRole(input: Tables["roles"]["Insert"]) {
  return unwrap(await supabase.from("roles").insert(input).select().single());
}

export async function updateRole(id: string, input: Tables["roles"]["Update"]) {
  return unwrap(await supabase.from("roles").update(input).eq("id", id).select().single());
}

export async function deleteRole(id: string) {
  const { error } = await supabase.from("roles").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ------------------------------- audit ------------------------------- */

export type AuditFilters = {
  user?: string;
  action?: string;
  documentNumber?: string;
  party?: string;
  from?: string;
  limit?: number;
};

export async function listAuditLogs(filters: AuditFilters = {}) {
  let query = supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 100);
  if (filters.user) query = query.ilike("user_name", `%${filters.user}%`);
  if (filters.action) query = query.eq("action", filters.action);
  if (filters.documentNumber) query = query.ilike("document_number", `%${filters.documentNumber}%`);
  if (filters.party) query = query.ilike("party_name", `%${filters.party}%`);
  if (filters.from) query = query.gte("created_at", filters.from);
  return unwrap(await query);
}

export async function logAudit(input: Tables["audit_logs"]["Insert"]) {
  await supabase.from("audit_logs").insert(input);
}

/* --------------------------- notifications --------------------------- */

export async function listNotifications() {
  return unwrap(
    await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
  );
}

export async function createNotification(input: Tables["notifications"]["Insert"]) {
  await supabase.from("notifications").insert(input);
}

export async function markNotificationRead(id: string, read = true) {
  const { error } = await supabase.from("notifications").update({ read }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead() {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("read", false);
  if (error) throw new Error(error.message);
}

/* ----------------------------- dashboard ----------------------------- */

export async function getDashboardStats() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [documents, drawings, parties, versions, thisMonth, users] = await Promise.all([
    supabase.from("documents").select("id", { count: "exact", head: true }),
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .neq("document_type", "CNC Program"),
    supabase.from("parties").select("id", { count: "exact", head: true }),
    supabase.from("document_versions").select("id", { count: "exact", head: true }),
    supabase
      .from("document_versions")
      .select("id", { count: "exact", head: true })
      .gte("uploaded_at", monthStart.toISOString()),
    supabase
      .from("profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("status", "Active"),
  ]);

  return {
    documents: documents.count ?? 0,
    drawings: drawings.count ?? 0,
    parties: parties.count ?? 0,
    versions: versions.count ?? 0,
    thisMonth: thisMonth.count ?? 0,
    activeUsers: users.count ?? 0,
  };
}

/* ------------------------------ search ------------------------------- */

export async function globalSearch(term: string) {
  const q = `%${term.trim().replace(/\s+/g, "%")}%`;
  const [documents, parties, parts] = await Promise.all([
    supabase
      .from("documents")
      .select("id, document_number, document_name, part_number, current_version, status, parties(name)")
      .or(
        `document_number.ilike.${q},document_name.ilike.${q},part_number.ilike.${q},drawing_number.ilike.${q},document_type.ilike.${q}`,
      )
      .limit(8),
    supabase.from("parties").select("id, name, code").or(`name.ilike.${q},code.ilike.${q}`).limit(5),
    supabase
      .from("parts")
      .select("id, part_number, part_name, party_id")
      .or(`part_number.ilike.${q},part_name.ilike.${q}`)
      .limit(5),
  ]);
  return {
    documents: documents.data ?? [],
    parties: parties.data ?? [],
    parts: parts.data ?? [],
  };
}
