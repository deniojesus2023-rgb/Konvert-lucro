/**
 * Approved, user-facing copy for every error situation. Never a stack
 * trace, SQL, an internal error code, or a driver message — just these
 * fixed, simple sentences.
 */
export const ERROR_MESSAGES = {
  saveFailed: "Não conseguimos salvar sua resposta. Tente novamente.",
  sessionExpired: "Sua sessão expirou. Vamos iniciar um novo diagnóstico.",
  conflictRecovered: "Encontramos uma resposta mais recente e atualizamos o diagnóstico.",
  finalizeFailed: "Não conseguimos gerar seu resultado agora. Suas respostas continuam salvas.",
  generic: "Algo deu errado. Tente novamente em instantes.",
} as const;
