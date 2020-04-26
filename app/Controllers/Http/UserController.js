'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/auth/src/Schemes/Session')} AuthSession */

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')

class UserController {
  /**
   * Show a list of all users.
   * GET users
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index({ request, response }) {
    const users = await User.all()

    return users
  }

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   */
  async store({ request }) {
    const data = request.all()

    const user = await User.create(data)

    return user
  }

  /**
   * Display a single user.
   * GET users/:id
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   */
  async show({ params, response, antl }) {
    const user = await User.find(params.id)

    if (!user) {
      return response.status(404).send({
        error: antl.formatMessage('messages.user.not.found'),
      })
    }

    return user
  }

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response, antl }) {
    const data = request.only([
      'username',
      'email',
      'password',
      'first_name',
      'last_name',
      'age',
      'phone',
    ])

    const user = await User.find(params.id)

    if (!user) {
      return response.status(404).send({
        error: antl.formatMessage('messages.user.not.found'),
      })
    }

    user.merge(data)

    await user.save()

    return user
  }

  /**
   * @param {object} ctx
   * @param {Response} ctx.response
   */
  async delete({ params, response, antl }) {
    const user = await User.find(params.id)

    if (!user) {
      return response.status(404).send({
        error: antl.formatMessage('messages.user.not.found'),
      })
    }

    user.delete()
  }
}

module.exports = UserController
