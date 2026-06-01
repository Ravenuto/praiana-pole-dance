import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { studentEmail, studentName } = await req.json();
    if (!studentEmail) {
      return Response.json({ error: 'Email obrigatório' }, { status: 400 });
    }

    const appUrl = "https://" + req.headers.get("host");

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: studentEmail,
      subject: "Bem-vinda à família Praiana! 💙",
      html: `
        <div style="font-family: 'Georgia', serif; max-width: 500px; margin: 0 auto; background: #f8f9fa; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #3b82c4, #2563a8); padding: 40px 32px; text-align: center;">
            <h1 style="color: white; font-size: 28px; margin: 0; font-weight: bold;">Praiana Pole Dance</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 16px;">& Artes</p>
          </div>
          <div style="padding: 40px 32px; background: white;">
            <h2 style="color: #1e3a5f; font-size: 22px; margin: 0 0 16px;">Oii${studentName ? ", " + studentName.split(" ")[0] : ""}! 🎉</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
              Estamos <strong>muito felizes</strong> de te ver por aqui. Você agora faz parte da nossa família Praiana! 💙
            </p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 28px;">
              Seu plano já está ativo e você pode começar a agendar suas aulas agora mesmo. Clique no botão abaixo para acessar o aplicativo:
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${appUrl}" style="background: #3b82c4; color: white; padding: 16px 36px; border-radius: 50px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
                Acessar meu espaço 💙
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 28px 0 0; line-height: 1.6;">
              Qualquer dúvida, estamos aqui! Te esperamos na aula. 🩰
            </p>
          </div>
          <div style="padding: 20px 32px; background: #f8f9fa; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">Praiana Pole Dance & Artes</p>
          </div>
        </div>
      `,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});