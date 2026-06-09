import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, credits, plan, plan_start_date } = body;

    if (!userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 });
    }

    // Buscar o usuário por email via filter (mais confiável que list+find)
    const { userEmail } = body;
    let targetUser = null;

    if (userEmail) {
      const found = await base44.asServiceRole.entities.User.filter({ email: userEmail }, '-created_date', 1);
      targetUser = found[0] || null;
    }

    if (!targetUser) {
      // Fallback: listar todos e encontrar por id
      const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 200);
      targetUser = allUsers.find(u => u.id === userId) || null;
    }

    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Pegar data atual e remover qualquer 'data' aninhado (corrige corrupção)
    const currentData = targetUser.data || {};
    const cleanData = Object.fromEntries(
      Object.entries(currentData).filter(([k]) => k !== 'data')
    );

    // Montar novo objeto data limpo
    const newData = { ...cleanData };
    if (credits !== undefined) newData.credits = credits;
    if (plan !== undefined) newData.plan = plan;
    if (plan_start_date !== undefined) newData.plan_start_date = plan_start_date;

    // Usar asServiceRole para garantir que sempre consegue atualizar
    await base44.asServiceRole.entities.User.update(targetUser.id, { data: newData });

    console.log(`Atualizado ${targetUser.email}: credits=${newData.credits}, plan=${newData.plan}`);

    return Response.json({ success: true, credits: newData.credits, plan: newData.plan });
  } catch (error) {
    console.error('Erro em updateStudentCredits:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});