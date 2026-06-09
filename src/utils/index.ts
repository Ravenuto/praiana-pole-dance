export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}

// Utilitário à prova de erros para ler créditos (resolve data.data aninhado)
export function getCredits(user) {
    if (!user) return 0;
    return user.credits ?? user.data?.credits ?? user.data?.data?.credits ?? 0;
}

// Utilitário à prova de erros para ler plano
export function getPlan(user) {
    if (!user) return null;
    return user.plan ?? user.data?.plan ?? user.data?.data?.plan ?? null;
}

// Utilitário à prova de erros para ler data de início do plano
export function getPlanStartDate(user) {
    if (!user) return null;
    return user.plan_start_date ?? user.data?.plan_start_date ?? user.data?.data?.plan_start_date ?? null;
}