'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/auth/src/Schemes/Session')} AuthSession */

const crypto = use('crypto')
const dateFns = use('date-fns')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')

/**
 * Resourceful controller for interacting with user's passwords
 */
class ForgotPasswordController {
  /**
   * Create/save a new reset password token.
   * POST /users/forgot
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response, antl }) {
    const email = request.input('email')

    const user = await User.findBy('email', email)

    if (!user) {
      return response.status(404).send({
        error: antl.formatMessage('messages.user.not.found'),
      })
    }

    user.token = crypto.randomBytes(10).toString('hex')
    user.token_created_at = new Date()

    await user.save()
  }

  /**
   * Reset password based on token.
   * PUT or PATCH /users/forgot
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ request, response, antl }) {
    const { token, password } = request.all()

    const user = await User.findBy('token', token)

    if (!user) {
      return response.status(404).send({
        error: antl.formatMessage('messages.user.not.found'),
      })
    }

    const tokenExpired =
      dateFns.differenceInDays(new Date(), user.token_created_at) > 2

    if (tokenExpired) {
      response.status(401).send({
        error: antl.formatMessage('messages.expired.token'),
      })
    }

    user.token = null
    user.token_created_at = null
    user.password = password

    await user.save()
  }
}

module.exports = ForgotPasswordController
