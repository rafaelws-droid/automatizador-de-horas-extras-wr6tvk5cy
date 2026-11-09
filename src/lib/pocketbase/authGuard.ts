import pb from './client'

/**
 * Tratamento global de falhas de autenticação/rede no cliente PocketBase.
 *
 * Problema que corrige: quando o token de sessão expira (ou o PocketBase
 * devolve 401 em qualquer requisição), as telas ficavam presas em "carregando"
 * ou em branco, porque o erro acontecia silenciosamente dentro dos services.
 * Aqui, qualquer 401 limpa a sessão — o AuthContext reage via authStore.onChange
 * e o ProtectedRoute redireciona para o login.
 *
 * Erros de rede (servidor inacessível, internet caindo) são propagados
 * normalmente para as telas, que exibem o estado de "Tentar novamente".
 */
export function setupAuthErrorHandling(): void {
  pb.afterSend = (response, data) => {
    if (response.status === 401) {
      pb.authStore.clear()
    }
    return data
  }
}
