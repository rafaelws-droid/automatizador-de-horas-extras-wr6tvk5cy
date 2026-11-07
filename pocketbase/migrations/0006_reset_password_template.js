// Personaliza o template do e-mail "Esqueci minha senha" para apontar para a
// tela do app (/redefinir-senha?token=...) em vez do painel administrativo do
// PocketBase. No PocketBase v0.36 os templates de e-mail são propriedades da
// coleção de autenticação (users.resetPasswordTemplate), não de app.settings().
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    users.resetPasswordTemplate.subject = 'Redefinição de senha - Automatizador de Horas Extras'
    users.resetPasswordTemplate.body = `<p>Olá,</p>
<p>Você clicou em <strong>"Esqueci minha senha"</strong> no Automatizador de Horas Extras, então recebeu este e-mail.</p>
<p>Para criar uma nova senha, acesse o link abaixo:</p>
<p><a href="https://horasextras.goskip.app/redefinir-senha?token={TOKEN}" target="_blank" rel="noopener">Redefinir minha senha</a></p>
<p>Se você não solicitou a redefinição, pode ignorar este e-mail com segurança. Sua senha atual continuará valendo.</p>
<p>Equipe Silveira Transportes</p>`

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Valores padrão do PocketBase v0.36 para o template de redefinição de senha.
    users.resetPasswordTemplate.subject = 'Reset password'
    users.resetPasswordTemplate.body = `<p>Hello,</p>
<p>Click on the button below to reset your password.</p>
<p><a class="btn" href="{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}" target="_blank" rel="noopener">Reset password</a></p>
<p><i>If you didn't ask to reset your password, you can ignore this email.</i></p>
<p>Thanks,<br/>{APP_NAME} team</p>`

    app.save(users)
  },
)
