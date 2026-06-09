import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Buscar TODOS os usuários
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 1000);
    
    let fixedCount = 0;
    const errors = [];

    // Iterar e limpar cada usuário
    for (const userData of allUsers) {
      try {
        const userDataObj = userData.data || {};
        
        // Se existe data.data aninhado, fazer o desaninhamento
        if (userDataObj.data && typeof userDataObj.data === 'object') {
          const cleanedData = {
            ...userDataObj,
            ...userDataObj.data, // Trazer os campos do data.data para cima
          };
          delete cleanedData.data; // Remover o data aninhado
          
          // Salvar de volta
          await base44.asServiceRole.entities.User.update(userData.id, { data: cleanedData });
          fixedCount++;
          console.log(`Limpeza para ${userData.email}: OK`);
        }
      } catch (err) {
        errors.push({ email: userData.email, error: err.message });
        console.error(`Erro limpando ${userData.email}:`, err.message);
      }
    }

    return Response.json({ 
      success: true, 
      fixedCount,
      totalUsers: allUsers.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Erro em cleanupUserSchema:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});