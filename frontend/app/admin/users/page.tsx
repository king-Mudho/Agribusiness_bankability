"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Pencil, UserPlus } from "lucide-react";
import { useState } from "react";

import { FormField, Modal, PASSWORD_HINT, PasswordInput, apiErrors } from "@/components/admin/forms";
import { Badge, DataTable, PageHeader, formatDate } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { useMe } from "@/hooks/useMe";
import { adminApi } from "@/lib/api/admin";
import type { AdminUserRow, RoleName } from "@/types/admin";

const ROLE_HELP: Record<RoleName, string> = {
  ADMIN: "Everything, including named records, exports and user management.",
  RESEARCHER: "Insights dashboard, research tools and framework.",
  ANALYST: "Insights dashboard and framework.",
  DATA_COLLECTOR: "No portal sections (field data collection role).",
  VIEWER: "No portal sections.",
};

type Dialog =
  | { kind: "create" }
  | { kind: "edit"; user: AdminUserRow }
  | { kind: "password"; user: AdminUserRow }
  | null;

function useRoles() {
  return useQuery({ queryKey: ["admin", "roles"], queryFn: () => adminApi.roles(), staleTime: Infinity });
}

function RoleSelect({ id, className, value, onChange }: { id: string; className: string; value: string; onChange: (v: RoleName) => void }) {
  const roles = useRoles();
  return (
    <select id={id} className={className} value={value} onChange={(e) => onChange(e.target.value as RoleName)}>
      {(roles.data ?? []).map((r) => (
        <option key={r.value} value={r.value}>
          {r.label}
        </option>
      ))}
    </select>
  );
}

function CreateUserForm({ onDone }: { onDone: (message: string) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ username: "", first_name: "", last_name: "", email: "", role: "ANALYST" as RoleName, password: "", confirm: "" });
  const [errors, setErrors] = useState<{ message: string; fields: Record<string, string> } | null>(null);
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const mutation = useMutation({
    mutationFn: () =>
      adminApi.createUser({
        username: form.username.trim(),
        password: form.password,
        role: form.role,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
      }),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      onDone(`Created ${user.username}. Share the password with them securely; they can change it under My account.`);
    },
    onError: (e) => setErrors(apiErrors(e)),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setErrors({ message: "The passwords don't match.", fields: { confirm: "Doesn't match the password." } });
      return;
    }
    setErrors(null);
    mutation.mutate();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <FormField label="Username" error={errors?.fields.username}>
        {(id, cls) => <input id={id} className={cls} value={form.username} onChange={(e) => set("username")(e.target.value)} autoComplete="off" required />}
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="First name">
          {(id, cls) => <input id={id} className={cls} value={form.first_name} onChange={(e) => set("first_name")(e.target.value)} />}
        </FormField>
        <FormField label="Last name">
          {(id, cls) => <input id={id} className={cls} value={form.last_name} onChange={(e) => set("last_name")(e.target.value)} />}
        </FormField>
      </div>
      <FormField label="Email (optional)">
        {(id, cls) => <input id={id} type="email" className={cls} value={form.email} onChange={(e) => set("email")(e.target.value)} />}
      </FormField>
      <FormField label="Role" error={errors?.fields.role} hint={ROLE_HELP[form.role]}>
        {(id, cls) => <RoleSelect id={id} className={cls} value={form.role} onChange={set("role")} />}
      </FormField>
      <FormField label="Password" error={errors?.fields.password} hint={PASSWORD_HINT}>
        {(id, cls) => <PasswordInput id={id} className={cls} value={form.password} onChange={set("password")} />}
      </FormField>
      <FormField label="Confirm password" error={errors?.fields.confirm}>
        {(id, cls) => <PasswordInput id={id} className={cls} value={form.confirm} onChange={set("confirm")} />}
      </FormField>
      {errors && !Object.keys(errors.fields).length && <p className="text-sm text-danger">{errors.message}</p>}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Creating..." : "Create user"}
      </Button>
    </form>
  );
}

function EditUserForm({ user, isSelf, onDone }: { user: AdminUserRow; isSelf: boolean; onDone: (message: string) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: (user.role ?? "VIEWER") as RoleName,
    is_active: user.is_active,
  });
  const [errors, setErrors] = useState<{ message: string; fields: Record<string, string> } | null>(null);

  const mutation = useMutation({
    mutationFn: () => adminApi.updateUser(user.id, form),
    onSuccess: (u) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      if (isSelf) queryClient.invalidateQueries({ queryKey: ["me"] });
      onDone(`Saved changes to ${u.username}.`);
    },
    onError: (e) => setErrors(apiErrors(e)),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setErrors(null);
        mutation.mutate();
      }}
      className="flex flex-col gap-3"
    >
      <p className="text-sm text-text-muted">
        Username: <span className="font-medium text-text">{user.username}</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="First name">
          {(id, cls) => <input id={id} className={cls} value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} />}
        </FormField>
        <FormField label="Last name">
          {(id, cls) => <input id={id} className={cls} value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} />}
        </FormField>
      </div>
      <FormField label="Email">
        {(id, cls) => <input id={id} type="email" className={cls} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />}
      </FormField>
      <FormField label="Role" error={errors?.fields.role} hint={isSelf ? "You can't remove your own Admin role." : ROLE_HELP[form.role]}>
        {(id, cls) => <RoleSelect id={id} className={cls} value={form.role} onChange={(role) => setForm((f) => ({ ...f, role }))} />}
      </FormField>
      <label className="flex items-center gap-2 text-sm text-text">
        <input
          type="checkbox"
          checked={form.is_active}
          disabled={isSelf}
          onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
          className="h-4 w-4"
        />
        Account active (can sign in)
      </label>
      {errors?.fields.is_active && <p className="text-xs text-danger">{errors.fields.is_active}</p>}
      {errors && !Object.keys(errors.fields).length && <p className="text-sm text-danger">{errors.message}</p>}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}

function SetPasswordForm({ user, onDone }: { user: AdminUserRow; onDone: (message: string) => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ message: string; fields: Record<string, string> } | null>(null);
  const mutation = useMutation({
    mutationFn: () => adminApi.setUserPassword(user.id, password),
    onSuccess: () => onDone(`New password set for ${user.username}. Share it with them securely.`),
    onError: (e) => setErrors(apiErrors(e)),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (password !== confirm) {
          setErrors({ message: "The passwords don't match.", fields: { confirm: "Doesn't match the password." } });
          return;
        }
        setErrors(null);
        mutation.mutate();
      }}
      className="flex flex-col gap-3"
    >
      <p className="text-sm text-text-muted">
        Set a new password for <span className="font-medium text-text">{user.username}</span>. Their old password stops working
        immediately.
      </p>
      <FormField label="New password" error={errors?.fields.password} hint={PASSWORD_HINT}>
        {(id, cls) => <PasswordInput id={id} className={cls} value={password} onChange={setPassword} />}
      </FormField>
      <FormField label="Confirm new password" error={errors?.fields.confirm}>
        {(id, cls) => <PasswordInput id={id} className={cls} value={confirm} onChange={setConfirm} />}
      </FormField>
      {errors && !Object.keys(errors.fields).length && <p className="text-sm text-danger">{errors.message}</p>}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving..." : "Set password"}
      </Button>
    </form>
  );
}

export default function AdminUsersPage() {
  const me = useMe();
  const query = useQuery({ queryKey: ["admin", "users"], queryFn: () => adminApi.users({ page_size: 200 }) });
  const [dialog, setDialog] = useState<Dialog>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function done(message: string) {
    setDialog(null);
    setNotice(message);
  }

  return (
    <>
      <PageHeader
        title="Users"
        description="Add staff accounts, choose what each person can see, deactivate accounts, and set new passwords."
        actions={
          <Button className="gap-2 whitespace-nowrap" onClick={() => setDialog({ kind: "create" })}>
            <UserPlus size={16} aria-hidden /> Add user
          </Button>
        }
      />

      {notice && (
        <div className="flex items-start justify-between gap-3 rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          <span>{notice}</span>
          <button className="text-xs underline" onClick={() => setNotice(null)}>
            Dismiss
          </button>
        </div>
      )}

      <DataTable<AdminUserRow>
        loading={query.isLoading}
        error={query.isError}
        rows={query.data?.results}
        rowKey={(r) => r.id}
        columns={[
          {
            key: "user",
            header: "User",
            render: (r) => (
              <div>
                <p className="font-medium">
                  {r.full_name || r.username}
                  {me.data?.username === r.username && <span className="ml-2 text-xs text-text-muted">(you)</span>}
                </p>
                <p className="text-xs text-text-muted">
                  {r.username}
                  {r.email ? ` · ${r.email}` : ""}
                </p>
              </div>
            ),
          },
          { key: "role", header: "Role", render: (r) => r.role_label ?? <span className="text-text-muted">None</span> },
          {
            key: "active",
            header: "Status",
            render: (r) => (r.is_active ? <Badge tone="bg-success/15 text-success">Active</Badge> : <Badge>Inactive</Badge>),
          },
          { key: "login", header: "Last sign-in", render: (r) => formatDate(r.last_login, true) },
          { key: "joined", header: "Created", render: (r) => formatDate(r.date_joined) },
          {
            key: "actions",
            header: "",
            className: "text-right",
            render: (r) => (
              <div className="flex justify-end gap-2">
                <button
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-header hover:bg-bg"
                  onClick={() => setDialog({ kind: "edit", user: r })}
                >
                  <Pencil size={13} aria-hidden /> Edit
                </button>
                <button
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-header hover:bg-bg"
                  onClick={() => setDialog({ kind: "password", user: r })}
                >
                  <KeyRound size={13} aria-hidden /> Set password
                </button>
              </div>
            ),
          },
        ]}
      />
      <p className="text-xs text-text-muted">
        Passwords are stored encrypted and are never shown again after they are set. Every change here is recorded in the audit log.
      </p>

      {dialog?.kind === "create" && (
        <Modal title="Add user" onClose={() => setDialog(null)}>
          <CreateUserForm onDone={done} />
        </Modal>
      )}
      {dialog?.kind === "edit" && (
        <Modal title="Edit user" onClose={() => setDialog(null)}>
          <EditUserForm user={dialog.user} isSelf={me.data?.username === dialog.user.username} onDone={done} />
        </Modal>
      )}
      {dialog?.kind === "password" && (
        <Modal title="Set password" onClose={() => setDialog(null)}>
          <SetPasswordForm user={dialog.user} onDone={done} />
        </Modal>
      )}
    </>
  );
}
