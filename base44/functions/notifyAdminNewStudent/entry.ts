import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { data } = body;
    if (!data) return Response.json({ ok: true });

    // Busca todos os admins
    const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });

    // Cria notificação para cada admin
    await Promise.all(
      admins.map((admin) =>
        base44.asServiceRole.entities.Notification.create({
          user_email: admin.email,
          type: "new_post",
          title: "Nova aluna cadastrada! 🎉",
          message: `${data.full_name || data.email} acabou de se cadastrar no app. Não esqueça de ativar o plano dela!`,
          link: "/admin",
          read: false,
          actor_name: data.full_name || data.email,
        })
      )
    );

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});