migrate(
  (app) => {
    const settings = app.settings()

    settings.meta.resetPasswordTemplate.subject =
      'Redefinição de senha - Automatizador de Horas Extras'
    settings.meta.resetPasswordTemplate.body = `<p>Olá,</p>
<p>Você clicou em <strong>"Esqueci minha senha"</strong> no Automatizador de Horas Extras, então recebeu este e-mail.</p>
<p>Para criar uma nova senha, acesse o link abaixo:</p>
<p><a href="https://horasextras.goskip.app/redefinir-senha?token={TOKEN}" target="_blank" rel="noopener">Redefinir minha senha</a></p>
<p>Se você não solicitou a redefinição, pode ignorar este e-mail com segurança. Sua senha atual continuará valendo.</p>
<p>Equipe Silveira Transportes</p>`

    app.save(settings)
  },
  (app) => {
    const settings = app.settings()

    settings.meta.resetPasswordTemplate.subject = 'Reset your password'
    settings.meta.resetPasswordTemplate.body = `<p>Hello,</p>
<p>Click on the button below to reset your password.</p>
<p><a class="btn" href="{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}" target="_blank" rel="noopener">Reset password</a></p>
<p><i>If you didn't ask to reset your password, you can ignore this email.</i></p>
<p>Thanks,<br/>{APP_NAME} team</p>`

    app.save(settings)
  },
)
