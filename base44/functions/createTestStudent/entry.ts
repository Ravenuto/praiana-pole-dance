import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Check if already exists
    const existing = await base44.asServiceRole.entities.User.filter({ email: "aluna.teste@praiana.app" });
    if (existing.length > 0) {
      return Response.json({ success: true, message: "Aluna teste já existe" });
    }

    // Invite the test student
    await base44.users.inviteUser("aluna.teste@praiana.app", "user");

    // Wait for user to be created
    await new Promise(r => setTimeout(r, 3000));

    // Get the created user - retry if needed
    let testUser = null;
    for (let i = 0; i < 3; i++) {
      const users = await base44.asServiceRole.entities.User.filter({ email: "aluna.teste@praiana.app" });
      if (users.length > 0) {
        testUser = users[0];
        break;
      }
      if (i < 2) await new Promise(r => setTimeout(r, 1500));
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