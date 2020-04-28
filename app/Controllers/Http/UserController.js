'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/auth/src/Schemes/Session')} AuthSession */

const { validate } = use('Validator')
const AddressValidator = use('App/Validators/Address')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')
const Database = use('Database')

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
   * @param {Response} ctx.response
   */
  async store({ request, response, antl }) {
    const { address, ...data } = request.only([
      'username',
      'email',
      'password',
      'first_name',
      'last_name',
      'age',
      'phone',
      'address',
      'specialty_id',
    ])

    const trx = await Database.beginTransaction()

    const user = await User.create(data, trx)

    if (address) {
      const validation = await validate(
        address,
        new AddressValidator().rules,
        antl.list('validation')
      )

      if (validation.fails()) {
        trx.rollback()
        return response.status(400).send(validation.messages())
      }

      await user.address().create(address, trx)
    }

    trx.commit()

    await user.loadMany(['address', 'specialty'])

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
    const { address, ...data } = request.only([
      'username',
      'email',
      'password',
      'first_name',
      'last_name',
      'age',
      'phone',
      'address',
    ])

    const user = await User.find(params.id)

    if (!user) {
      return response.status(404).send({
        error: antl.formatMessage('messages.user.not.found'),
      })
    }

    user.merge(data)

    const trx = await Database.beginTransaction()

    await user.save(trx)

    if (address) {
      const validation = await validate(
        address,
        new AddressValidator().rules,
        antl.list('validation')
      )

      if (validation.fails()) {
        trx.rollback()
        return response.status(400).send(validation.messages())
      }

      await user.address().delete()
      await user.address().create(address, trx)
    }

    trx.commit()

    await user.load('address')

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
