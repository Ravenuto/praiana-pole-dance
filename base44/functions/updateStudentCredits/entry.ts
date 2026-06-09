import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, credits, plan, plan_start_date } = await req.json();

    if (!userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 });
    }

    // Buscar o usuário atual direto do banco
    const allUsers = await base44.asServiceRole.entities.User.list();
    const targetUser = allUsers.find(u => u.id === userId);

    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Pegar o data atual, mas remover qualquer 'data' aninhado dentro dele
    const currentData = targetUser.data || {};
    console.log(`currentData original: ${JSON.stringify(currentData)}`);
    
    // Destruturar removendo o campo 'data' aninhado (evita data.data)
    const cleanData = Object.fromEntries(
      Object.entries(currentData).filter(([k]) => k !== 'data')
    );

    // Montar o novo objeto data limpo
    const newData = { ...cleanData };
    if (credits !== undefined) newData.credits = credits;
    if (plan !== undefined) newData.plan = plan;
    if (plan_start_date !== undefined) newData.plan_start_date = plan_start_date;

    console.log(`newData a salvar: ${JSON.stringify(newData)}`);
    await base44.asServiceRole.entities.User.update(userId, { data: newData });

    console.log(`Créditos atualizados para ${targetUser.email}: credits=${newData.credits}`);

    return Response.json({ success: true, credits: newData.credits, plan: newData.plan });
  } catch (error) {
    console.error('Erro em updateStudentCredits:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});