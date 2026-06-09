import React from 'react';

const UserNotRegisteredError = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <img
            src="https://media.base44.com/images/public/6a0b29752977eaee21c7da55/c2269a69d_Logo_PRAIANA.png"
            alt="Praiana Pole Dance"
            className="w-20 h-20 object-contain"
          />
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⏳</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground mb-3">Aguardando aprovação</h1>
          <p className="text-muted-foreground text-sm mb-4">
            Seu cadastro está sendo analisado pelo estúdio. Em breve você receberá acesso ao app 💙
          </p>
          <p className="text-muted-foreground text-sm mb-6">
            Qualquer dúvida, entre em contato conosco pelo WhatsApp.
          </p>
          <button
            onClick={() => { window.location.href = '/login'; }}
            className="text-primary text-sm font-medium hover:underline"
          >
            Voltar para o login
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;