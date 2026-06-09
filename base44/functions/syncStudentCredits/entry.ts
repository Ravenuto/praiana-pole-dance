import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    // Disparada quando StudentInvitation muda para "activated"
    if (event.type !== 'update' || event.entity_name !== 'StudentInvitation') {
      return Response.json({ success: true });
    }

    const invitation = data;
    if (invitation.status !== 'activated' || !invitation.email) {
      return Response.json({ success: true });
    }

    // Procurar User com esse email
    const users = await base44.asServiceRole.entities.User.filter(
      { email: invitation.email },
      '-created_date',
      1
    );

    if (users.length === 0) {
      console.log(`Usuário não encontrado para email: ${invitation.email}`);
      return Response.json({ success: true });
    }

    const user = users[0];
    const currentData = user.data || {};
    
    // Remover qualquer 'data' aninhado para evitar corrupção
    const cleanData = Object.fromEntries(
      Object.entries(currentData).filter(([k]) => k !== 'data')
    );

    // Salvar SEMPRE dentro de data{} — nunca na raiz
    const newData = {
      ...cleanData,
      credits: invitation.credits || 4,
      plan: invitation.plan || '4_aulas',
      plan_start_date: new Date().toISOString().split('T')[0],
    };

    await base44.asServiceRole.entities.User.update(user.id, { data: newData });
    console.log(`Créditos sincronizados para ${invitation.email}: ${invitation.credits}`);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Erro em syncStudentCredits:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});