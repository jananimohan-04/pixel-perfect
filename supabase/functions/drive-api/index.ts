import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getAccessTokenFromRefresh(refreshToken: string, clientId: string, clientSecret: string) {
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('refresh_token', refreshToken);
  params.append('grant_type', 'refresh_token');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!res.ok) throw new Error('Failed to refresh token: ' + await res.text());
  const data = await res.json();
  return data.access_token;
}

async function findFolder(name: string, parentId: string, token: string): Promise<string | null> {
  let q = `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false`;
  if (parentId) q += ` and '${parentId}' in parents`;

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Drive find folder failed: ${await res.text()}`);
  const data = await res.json();
  return data.files?.[0]?.id || null;
}

async function createFolder(name: string, parentId: string, token: string): Promise<string> {
  const body: any = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) body.parents = [parentId];

  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error(`Drive create folder failed: ${await res.text()}`);
  const data = await res.json();
  return data.id;
}

async function uploadFileToDrive(file: File, folderId: string, token: string) {
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify({ name: file.name, parents: [folderId] })], { type: 'application/json' }));
  form.append('file', file);
  
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  
  if (!res.ok) throw new Error(`Drive file upload failed: ${await res.text()}`);
  return await res.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') || '';
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';

    // --- OAUTH FLOW ---
    if (action === 'auth-url') {
      const partyId = url.searchParams.get('partyId');
      if (!partyId) throw new Error('partyId required');
      
      const redirectUri = `https://poioxmtrlqbiurrpgehd.supabase.co/functions/v1/drive-api/callback`;
      // Use prompt=consent to ensure we always get a refresh token
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=https://www.googleapis.com/auth/drive.file&access_type=offline&prompt=consent&state=${partyId}`;
      
      return new Response(JSON.stringify({ url: authUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'callback') {
      const code = url.searchParams.get('code');
      const partyId = url.searchParams.get('state');
      
      if (!code || !partyId) throw new Error('Missing code or state');

      const redirectUri = `https://poioxmtrlqbiurrpgehd.supabase.co/functions/v1/drive-api/callback`;
      const params = new URLSearchParams();
      params.append('client_id', GOOGLE_CLIENT_ID);
      params.append('client_secret', GOOGLE_CLIENT_SECRET);
      params.append('code', code);
      params.append('grant_type', 'authorization_code');
      params.append('redirect_uri', redirectUri);

      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });

      if (!res.ok) throw new Error('OAuth exchange failed: ' + await res.text());
      const data = await res.json();
      
      const refreshToken = data.refresh_token;
      if (!refreshToken) throw new Error('No refresh token received. You might need to revoke access in your Google Account and try again.');

      const accessToken = data.access_token;
      
      // Get user's email to store
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const userInfo = await userInfoRes.json();

      // Ensure root folder exists for this party
      let rootFolderId = await findFolder('CNC Vault', '', accessToken);
      if (!rootFolderId) {
        rootFolderId = await createFolder('CNC Vault', '', accessToken);
      }

      const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

      await supabaseClient.from('cncvault_parties').update({ 
        drive_refresh_token: refreshToken,
        drive_folder_id: rootFolderId,
        drive_email: userInfo.email || ''
      }).eq('id', partyId);

      return new Response('<html><body><h1>Drive Connected Successfully!</h1><p>You can close this window now.</p><script>setTimeout(() => window.close(), 2000);</script></body></html>', {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // --- AUTHORIZED ROUTES ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    if (action === 'status') {
      const partyId = url.searchParams.get('partyId');
      if (!partyId) throw new Error('partyId required');
      const { data } = await supabaseClient.from('cncvault_parties').select('drive_refresh_token, drive_email').eq('id', partyId).single();
      return new Response(JSON.stringify({ 
        connected: !!data?.drive_refresh_token,
        email: data?.drive_email 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'list-folders' && req.method === 'GET') {
      const partyId = url.searchParams.get('partyId');
      if (!partyId) throw new Error('partyId required');
      
      const { data, error } = await supabaseClient
        .from('cncvault_drive_folders')
        .select('*')
        .eq('party_id', partyId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      return new Response(JSON.stringify({ folders: data || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'create-folder' && req.method === 'POST') {
      const { data: rbacCheck } = await supabaseClient.rpc('has_permission', { _user_id: user.id, _permission: 'manage_settings' });
      if (!rbacCheck) throw new Error('Permission denied');

      const body = await req.json();
      const { partyId, name, parentFolderId } = body;
      if (!partyId || !name) throw new Error('partyId and name required');

      const { data: partyData } = await supabaseClient
        .from('cncvault_parties')
        .select('drive_refresh_token, drive_folder_id')
        .eq('id', partyId)
        .single();

      if (!partyData?.drive_refresh_token) throw new Error('This party has not connected a Google Drive.');

      const token = await getAccessTokenFromRefresh(partyData.drive_refresh_token, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

      let googleParentId = partyData.drive_folder_id;

      if (parentFolderId) {
        const { data: parentFolder } = await supabaseClient
          .from('cncvault_drive_folders')
          .select('google_folder_id')
          .eq('id', parentFolderId)
          .single();

        if (parentFolder?.google_folder_id) {
          googleParentId = parentFolder.google_folder_id;
        }
      }

      const googleFolderId = await createFolder(name, googleParentId, token);

      const { data: newFolderRecord, error: dbError } = await supabaseClient
        .from('cncvault_drive_folders')
        .insert({
          party_id: partyId,
          google_folder_id: googleFolderId,
          name,
          parent_folder_id: parentFolderId || null
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return new Response(JSON.stringify({ folder: newFolderRecord }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'upload' && req.method === 'POST') {
      const { data: rbacCheck } = await supabaseClient.rpc('has_permission', { _user_id: user.id, _permission: 'upload' });
      if (!rbacCheck) throw new Error('Permission denied');

      const formData = await req.formData();
      const file = formData.get('file') as File;
      const partyId = formData.get('partyId') as string;
      const documentNumber = formData.get('documentNumber') as string;
      const version = formData.get('version') as string;
      const targetFolderId = (formData.get('targetFolderId') as string) || '';

      if (!file || !partyId || !documentNumber || !version) {
        throw new Error('Missing fields');
      }

      // Lookup party tokens
      const { data: partyData } = await supabaseClient.from('cncvault_parties')
        .select('drive_refresh_token, drive_folder_id, name').eq('id', partyId).single();
      
      if (!partyData?.drive_refresh_token) throw new Error('This party has not connected a Google Drive.');

      const token = await getAccessTokenFromRefresh(partyData.drive_refresh_token, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
      
      // Create hierarchy
      let baseFolderId = partyData.drive_folder_id;
      if (targetFolderId) {
        baseFolderId = targetFolderId;
      }
      let docFolderId = await findFolder(documentNumber, baseFolderId, token);
      if (!docFolderId) docFolderId = await createFolder(documentNumber, baseFolderId, token);
      
      let versionFolderId = await findFolder(`V${version}`, docFolderId, token);
      if (!versionFolderId) versionFolderId = await createFolder(`V${version}`, docFolderId, token);

      const uploadedFile = await uploadFileToDrive(file, versionFolderId, token);

      return new Response(JSON.stringify({
        fileId: uploadedFile.id,
        folderId: versionFolderId,
        webViewLink: uploadedFile.webViewLink
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if ((action === 'download' || action === 'view') && req.method === 'GET') {
      const driveFileId = url.searchParams.get('fileId');
      const documentId = url.searchParams.get('documentId');
      if (!driveFileId || !documentId) throw new Error('Missing fileId or documentId');

      const { data: canAccess } = await supabaseClient.rpc('can_access_document', { _user_id: user.id, _document_id: documentId });
      if (!canAccess) throw new Error('Permission denied');

      // Get the document's party to get the right refresh token
      const { data: docData } = await supabaseClient.from('cncvault_documents').select('party_id').eq('id', documentId).single();
      if (!docData) throw new Error('Document not found');

      const { data: partyData } = await supabaseClient.from('cncvault_parties').select('drive_refresh_token').eq('id', docData.party_id).single();
      if (!partyData?.drive_refresh_token) throw new Error('Drive not connected for this document');

      const token = await getAccessTokenFromRefresh(partyData.drive_refresh_token, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

      const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!driveRes.ok) throw new Error(`Drive fetch failed: ${driveRes.statusText}`);

      const headers = new Headers(corsHeaders);
      const contentType = driveRes.headers.get('Content-Type');
      if (contentType) headers.set('Content-Type', contentType);
      headers.set('Content-Disposition', action === 'download' ? 'attachment' : 'inline');

      return new Response(driveRes.body, { headers });
    }

    throw new Error('Unknown route');
    
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
