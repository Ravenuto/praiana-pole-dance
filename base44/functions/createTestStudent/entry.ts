import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Invite the test student
    await base44.users.inviteUser("aluna.teste@praiana.app", "user");

    // Get the created user
    const users = await base44.asServiceRole.entities.User.filter({ email: "aluna.teste@praiana.app" });
    const testUser = users[0];

    if (testUser) {
      // Update with test data
      await base44.asServiceRole.entities.User.update(testUser.id, {
        plan: "4_aulas",
        credits: 2,
        plan_start_date: "2026-05-15",
        last_payment_date: "2026-05-15"
      });
    }

    return Response.json({ success: true, message: "Aluna teste criada com email: aluna.teste@praiana.app" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});