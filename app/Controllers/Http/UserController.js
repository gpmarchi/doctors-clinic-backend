'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/auth/src/Schemes/Session')} AuthSession */

const { validate } = use('Validator')
const AddressValidator = use('App/Validators/Address')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Address = use('App/Models/Address')

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
    const users = await User.query().paginate()

    return users
  }

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response, antl }) {
    const { address, roles, permissions, ...data } = request.only([
      'username',
      'email',
      'password',
      'first_name',
      'last_name',
      'birthdate',
      'phone',
      'address',
      'avatar_id',
      'specialty_id',
      'clinic_id',
      'roles',
      'permissions',
    ])

    const user = await User.create(data)

    if (address) {
      const validation = await validate(
        address,
        new AddressValidator().rules,
        antl.list('validation')
      )

      if (validation.fails()) {
        return response.status(400).send(validation.messages())
      }

      await user.address().create(address)
    }

    if (roles) {
      await user.roles().attach(roles)
    }

    if (permissions) {
      await user.permissions().attach(permissions)
    }

    await user.loadMany([
      'address',
      'specialty',
      'avatar',
      'clinic',
      'roles',
      'permissions',
    ])

    return user
  }

  /**
   * Display a single user.
   * GET users/:id
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async show({ params, response, antl, auth }) {
    const user = await User.find(params.id)

    if (!user) {
      return response.status(404).send({
        error: antl.formatMessage('messages.user.not.found'),
      })
    }

    const loggedUser = await auth.getUser()

    if (loggedUser.id !== user.id && !(await loggedUser.is('administrator'))) {
      return response.status(403).send({
        error: antl.formatMessage('messages.show.unauthorized'),
      })
    }

    await user.loadMany([
      'address',
      'specialty',
      'clinic',
      'roles',
      'permissions',
    ])

    return user
  }

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async update({ params, request, response, antl, auth }) {
    const { address, roles, permissions, ...data } = request.only([
      'username',
      'email',
      'password',
      'first_name',
      'last_name',
      'birthdate',
      'phone',
      'address',
      'specialty_id',
      'clinic_id',
      'roles',
      'permissions',
    ])

    const loggedUser = await auth.getUser()

    if ((roles || permissions) && !(await loggedUser.is('administrator'))) {
      return response.status(403).send({
        error: antl.formatMessage('messages.roles.permissions.unauthorized'),
      })
    }

    const user = await User.find(params.id)

    if (!user) {
      return response.status(404).send({
        error: antl.formatMessage('messages.user.not.found'),
      })
    }

    if (loggedUser.id !== user.id && !(await loggedUser.is('administrator'))) {
      return response.status(403).send({
        error: antl.formatMessage('messages.update.unauthorized'),
      })
    }

    user.merge(data)

    await user.save()

    if (address) {
      const validation = await validate(
        address,
        new AddressValidator().rules,
        antl.list('validation')
      )

      if (validation.fails()) {
        return response.status(400).send(validation.messages())
      }

      const savedAddress = await Address.findBy('user_id', user.id)

      if (savedAddress) {
        savedAddress.merge(address)
        await savedAddress.save()
      } else {
        await Address.create({ ...address, user_id: user.id })
      }
    }

    if (roles) {
      await user.roles().sync(roles)
    }

    if (permissions) {
      await user.permissions().sync(permissions)
    }

    await user.loadMany([
      'address',
      'specialty',
      'clinic',
      'roles',
      'permissions',
    ])

    return user
  }

  /**
   * @param {object} ctx
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async delete({ params, response, antl, auth }) {
    const user = await User.find(params.id)

    if (!user) {
      return response.status(404).send({
        error: antl.formatMessage('messages.user.not.found'),
      })
    }

    const loggedUser = await auth.getUser()

    if (loggedUser.id !== user.id && !(await loggedUser.is('administrator'))) {
      return response.status(403).send({
        error: antl.formatMessage('messages.delete.unauthorized'),
      })
    }

    user.delete()
  }
}

module.exports = UserController
