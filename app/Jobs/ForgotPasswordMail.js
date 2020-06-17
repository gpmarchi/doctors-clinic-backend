'use strict'

/** @typedef {import('@adonisjs/mail/src/Mail')} Mail */
const Mail = use('Mail')
/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

class ForgotPasswordMail {
  static get concurrency() {
    return 1
  }

  static get key() {
    return 'ForgotPasswordMail-job'
  }

  async handle({ email, token }) {
    console.log('ForgotPasswordMail-job started')

    await Mail.send(
      ['emails.reset_password'],
      {
        email,
        token,
        link: `${Env.get('FORGOT_PASSWORD_URL')}?token=${token}`,
      },
      (message) => {
        message
          .to(email)
          .from('admin@email.com', "Admin | Doctor's Clinic")
          .subject('Recuperação de senha')
      }
    )
  }
}

module.exports = ForgotPasswordMail
