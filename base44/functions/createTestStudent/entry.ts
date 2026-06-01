import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Delete if exists to recreate fresh
    const existing = await base44.asServiceRole.entities.User.filter({ email: "aluna.teste@praiana.app" });
    if (existing.length > 0) {
      await base44.asServiceRole.entities.User.delete(existing[0].id);
      await new Promise(r => setTimeout(r, 1000));
    }

    // Invite the test student
    await base44.users.inviteUser("aluna.teste@praiana.app", "user");

    // Wait for user to be created with longer delay
    await new Promise(r => setTimeout(r, 5000));

    // Get the created user with multiple retries
    let testUser = null;
    for (let i = 0; i < 5; i++) {
      const users = await base44.asServiceRole.entities.User.filter({ email: "aluna.teste@praiana.app" });
      if (users.length > 0) {
        testUser = users[0];
        break;
      }
      if (i < 4) await new Promise(r => setTimeout(r, 2000));
    }

    if (testUser) {
      // Update with test data
      await base44.asServiceRole.entities.User.update(testUser.id, {
        full_name: "Aluna Teste",
        plan: "4_aulas",
        credits: 2,
        plan_start_date: "2026-05-15",
        last_payment_date: "2026-05-15",
        is_active: true
      });
    }

    return Response.json({ success: true, message: "Aluna teste criada com email: aluna.teste@praiana.app" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});