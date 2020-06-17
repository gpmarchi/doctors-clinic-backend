'use strict'

/** @type {import('@adonisjs/framework/src/Hash')} */
const Hash = use('Hash')

const Kue = use('Kue')
const Job = use('App/Jobs/ForgotPasswordMail')

const UserHook = (exports = module.exports = {})

UserHook.hashPassword = async (userInstance) => {
  if (userInstance.dirty.password) {
    userInstance.password = await Hash.make(userInstance.password)
  }
}

UserHook.sendForgotPasswordMail = async (userInstance) => {
  if (userInstance.dirty.token) {
    Kue.dispatch(
      Job.key,
      { email: userInstance.email, token: userInstance.token },
      { attempts: 3 }
    )
  }
}
