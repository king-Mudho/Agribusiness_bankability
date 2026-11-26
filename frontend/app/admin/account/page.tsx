"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { FormField, PASSWORD_HINT, PasswordInput, apiErrors } from "@/components/admin/forms";
import { Card, PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { useMe } from "@/hooks/useMe";
import { adminApi } from "@/lib/api/admin";

export default function MyAccountPage() {
  const me = useMe();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ message: string; fields: Record<string, string> } | null>(null);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () => adminApi.changeOwnPassword(current, next),
    onSuccess: () => {
      setSuccess(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    },
    onError: (e) => setErrors(apiErrors(e)),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);
    if (next !== confirm) {
      setErrors({ message: "The new passwords don't match.", fields: { confirm: "Doesn't match the new password." } });
      return;
    }
    setErrors(null);
    mutation.mutate();
  }

  return (
    <>
      <PageHeader title="My account" description="Your sign-in details and password." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Account">
          <dl className="flex flex-col gap-3 text-sm">
            {[
              ["Username", me.data?.username],
              ["Name", me.data?.full_name || "-"],
              ["Email", me.data?.email || "-"],
              ["Role", me.data?.role_label ?? "-"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 border-b border-border pb-2 last:border-0">
                <dt className="text-text-muted">{label}</dt>
                <dd className="font-medium text-text">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-text-muted">An Admin can change your name, email or role from the Users page.</p>
        </Card>

        <Card title="Change password">
          <form onSubmit={submit} className="flex flex-col gap-3">
            <FormField label="Current password" error={errors?.fields.current_password}>
              {(id, cls) => <PasswordInput id={id} className={cls} value={current} onChange={setCurrent} autoComplete="current-password" />}
            </FormField>
            <FormField label="New password" error={errors?.fields.new_password} hint={PASSWORD_HINT}>
              {(id, cls) => <PasswordInput id={id} className={cls} value={next} onChange={setNext} />}
            </FormField>
            <FormField label="Confirm new password" error={errors?.fields.confirm}>
              {(id, cls) => <PasswordInput id={id} className={cls} value={confirm} onChange={setConfirm} />}
            </FormField>
            {errors && !Object.keys(errors.fields).length && <p className="text-sm text-danger">{errors.message}</p>}
            {success && <p className="text-sm text-success">Password changed. Use the new one next time you sign in.</p>}
            <Button type="submit" disabled={mutation.isPending || !current || !next}>
              {mutation.isPending ? "Saving..." : "Change password"}
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
