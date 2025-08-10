// src/dashboard/ContactsPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Page, Table, Button, Box, TextButton,
  FormField, Input, Loader, Card, Divider
} from '@wix/design-system';

type Contact = { _id: string; name?: string; email?: string; phone?: string };
type ContactForm = { name: string; email?: string; phone?: string };

// ---------- helpers ----------
function normalize(raw: any): Contact {
  const c = raw?.contact ?? raw;
  return {
    _id: c._id,
    name: [c.info?.name?.first, c.info?.name?.last].filter(Boolean).join(' ') || '',
    email: c.info?.emails?.items?.[0]?.email,
    phone: c.info?.phones?.items?.[0]?.phone,
  };
}

// Read body ONCE, parse if JSON, surface clear errors
async function httpJson<T = any>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const raw = await res.text(); // read only once

  let data: any = null;
  if (raw) {
    try { data = JSON.parse(raw); } catch { /* keep as text */ }
  }

  if (!res.ok) {
    const reason =
      (data && (data.error || data.message)) ||
      raw ||
      `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }

  return (data ?? ({} as any)) as T;
}

// ---- API (expects your /api/contacts routes) ----
async function listContacts(): Promise<Contact[]> {
  const json = await httpJson<any>('/api/contacts');
  return (json.items ?? []).map(normalize);
}
async function createContact(body: ContactForm): Promise<Contact> {
  const json = await httpJson<any>('/api/contacts', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return normalize(json);
}
async function updateContact(id: string, body: ContactForm): Promise<Contact> {
  const json = await httpJson<any>(`/api/contacts/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return normalize(json);
}
async function deleteContact(id: string): Promise<void> {
  await httpJson<void>(`/api/contacts/${id}`, { method: 'DELETE' });
}
// -------------------------------------------------

export default function ContactsPage() {
  const [rows, setRows] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // inline editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactForm>({ name: '', email: '', phone: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(editing?._id);

  // initial load
  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await listContacts();
        setRows(data);
      } catch (e: any) {
        setLoadError(`Failed to load contacts: ${e?.message ?? 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // open/close editor
  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '' });
    setFormError(null);
    setEditorOpen(true);
  };
  const openEdit = (c: Contact) => {
    setEditing(c);
    setForm({ name: c.name || '', email: c.email, phone: c.phone });
    setFormError(null);
    setEditorOpen(true);
  };
  const cancelEditor = () => {
    setEditorOpen(false);
    setEditing(null);
    setSaving(false);
    setFormError(null);
  };

  // create/update
  const submit = async () => {
    setFormError(null);

    const [first, ...rest] = (form.name || '').trim().split(/\s+/);
    if (!first) {
      setFormError('Name is required.');
      return;
    }
    const fullName = [first, rest.join(' ')].filter(Boolean).join(' ');
    const body: ContactForm = { name: fullName, email: form.email, phone: form.phone };

    setSaving(true);
    try {
      if (isEditing && editing) {
        const updated = await updateContact(editing._id, body);
        setRows(prev => prev.map(r => (r._id === updated._id ? updated : r)));
      } else {
        const created = await createContact(body);
        setRows(prev => [created, ...prev]); // show immediately
      }
      cancelEditor();
    } catch (e: any) {
      setFormError(`Failed to save: ${e?.message ?? 'Unknown error'}`);
      setSaving(false);
    }
  };

  // delete (optimistic)
  const onDelete = async (c: Contact) => {
    if (!confirm(`Delete "${c.name || c._id}"?`)) return;
    const snapshot = rows;
    setRows(snapshot.filter(r => r._id !== c._id));
    try {
      await deleteContact(c._id);
    } catch (e: any) {
      alert(`Failed to delete: ${e?.message ?? 'Unknown error'}`);
      setRows(snapshot); // revert
    }
  };

  // table
  const columns = useMemo(() => ([
    { title: 'Name',  render: (r: Contact) => r.name ?? '-' },
    { title: 'Email', render: (r: Contact) => r.email ?? '-' },
    { title: 'Phone', render: (r: Contact) => r.phone ?? '-' },
    {
      title: 'Actions',
      render: (r: Contact) => (
        <Box gap="8px">
          <TextButton onClick={() => openEdit(r)}>Edit</TextButton>
          <TextButton skin="destructive" onClick={() => onDelete(r)}>Delete</TextButton>
        </Box>
      ),
    },
  ]), [rows]);

  return (
    <Page>
      <Page.Header
        title="Manage Contacts"
        actionsBar={<Button onClick={openAdd}>Add Contact</Button>}
      />
      <Page.Content>
        {/* load error banner */}
        {loadError && (
          <Box padding="12px" marginBottom="12px" backgroundColor="D80">
            {loadError}
          </Box>
        )}

        {/* inline editor */}
        {editorOpen && (
          <>
            <Card>
              <Card.Header title={isEditing ? 'Edit Contact' : 'Add Contact'} />
              <Card.Divider />

              {formError && (
                <Box padding="12px" backgroundColor="R80">
                  {formError}
                </Box>
              )}

              <Card.Content>
                <Box direction="vertical" gap="16px" maxWidth="520px">
                  <FormField label="Full name" required>
                    <Input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: (e.target as HTMLInputElement).value }))}
                      placeholder="Jane Doe"
                      disabled={saving}
                    />
                  </FormField>
                  <FormField label="Email">
                    <Input
                      value={form.email || ''}
                      onChange={e => setForm(f => ({ ...f, email: (e.target as HTMLInputElement).value }))}
                      placeholder="jane@example.com"
                      disabled={saving}
                    />
                  </FormField>
                  <FormField label="Phone">
                    <Input
                      value={form.phone || ''}
                      onChange={e => setForm(f => ({ ...f, phone: (e.target as HTMLInputElement).value }))}
                      placeholder="+972 54 123 4567"
                      disabled={saving}
                    />
                  </FormField>
                </Box>
              </Card.Content>
              <Card.Divider />
              <Card.Content>
                <Box gap="12px">
                  <Button onClick={submit} disabled={saving}>
                    {saving ? 'Saving…' : isEditing ? 'Save' : 'Create'}
                  </Button>
                  <Button priority="secondary" onClick={cancelEditor} disabled={saving}>
                    Cancel
                  </Button>
                </Box>
              </Card.Content>
            </Card>
            <Divider />
          </>
        )}

        {/* list */}
        {loading ? (
          <Box padding="24px"><Loader /></Box>
        ) : rows.length ? (
          <Table columns={columns as any} data={rows} />
        ) : (
          <Box padding="24px">No contacts yet. Click “Add Contact”.</Box>
        )}
      </Page.Content>
    </Page>
  );
}
