'use strict'

/** @type {import('@adonisjs/framework/src/Hash')} */
const Hash = use('Hash')
/** @typedef {import('@adonisjs/mail/src/Mail')} Mail */
const Mail = use('Mail')
/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

const UserHook = (exports = module.exports = {})

UserHook.hashPassword = async (userInstance) => {
  if (userInstance.dirty.password) {
    userInstance.password = await Hash.make(userInstance.password)
  }
}

UserHook.sendForgotPasswordMail = async (userInstance) => {
  if (userInstance.dirty.token) {
    await Mail.send(
      ['emails.reset_password'],
      {
        email: userInstance.email,
        token: userInstance.token,
        link: `${Env.get('FORGOT_PASSWORD_URL')}?token=${userInstance.token}`,
      },
      (message) => {
        message
          .to(userInstance.email)
          .from('admin@email.com', "Admin | Doctor's Clinic")
          .subject('Recuperação de senha')
      }
    )
  }
}
