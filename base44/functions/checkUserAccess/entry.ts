import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const { email } = await req.json();
    if (!email) {
      return Response.json({ approved: false });
    }

    const base44 = createClientFromRequest(req);

    // Busca o usuário pelo email usando service role
    const users = await base44.asServiceRole.entities.User.filter({ email }, '-created_date', 1);
    const user = users?.[0];

    if (!user) {
      return Response.json({ approved: false, reason: 'not_found' });
    }

    // Verifica is_active na raiz ou dentro de data
    const isActive = user.is_active === true || user.data?.is_active === true;

    return Response.json({ approved: isActive, user_id: user.id });
  } catch (error) {
    return Response.json({ approved: false, error: error.message }, { status: 500 });
  }
});