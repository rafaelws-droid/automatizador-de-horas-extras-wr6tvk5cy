import pb from '@/lib/pocketbase/client'

/** Pede ao PocketBase o envio do e-mail de redefinição de senha. */
export async function solicitarRedefinicaoSenha(email: string): Promise<void> {
  await pb.collection('users').requestPasswordReset(email.trim())
}

/** Confirma a redefinição de senha usando o token recebido por e-mail. */
export async function confirmarRedefinicaoSenha(
  token: string,
  senha: string,
  confirmacao: string,
): Promise<void> {
  await pb.collection('users').confirmPasswordReset(token, senha, confirmacao)
}
