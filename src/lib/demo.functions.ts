import { createServerFn } from "@tanstack/react-start";

export const DEMO_ADMIN_EMAIL = "admin@safetrail.demo";
export const DEMO_ADMIN_PASSWORD = "Admin@1234";

/**
 * Ensures the demo admin account exists. Safe to call repeatedly.
 * Public on purpose — only ever creates the fixed demo account and grants
 * it the admin role if it isn't present.
 */
export const ensureDemoAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Find existing user by email
  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw new Error(listErr.message);
  let user = list.users.find((u) => u.email?.toLowerCase() === DEMO_ADMIN_EMAIL);

  if (!user) {
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: DEMO_ADMIN_EMAIL,
      password: DEMO_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Demo Admin", signup_role: "admin" },
    });
    if (createErr) throw new Error(createErr.message);
    user = created.user!;
  }

  // Make sure profile + admin role exist (in case trigger didn't assign admin)
  await supabaseAdmin
    .from("profiles")
    .upsert({ id: user.id, email: DEMO_ADMIN_EMAIL, full_name: "Demo Admin" }, { onConflict: "id" });
  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });

  return { ok: true, email: DEMO_ADMIN_EMAIL };
});
