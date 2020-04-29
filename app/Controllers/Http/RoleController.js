'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */

const Role = use('Role')

/**
 * Resourceful controller for interacting with roles
 */
class RoleController {
  /**
   * Show a list of all roles.
   * GET roles
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index({ request, response }) {
    const roles = await Role.all()

    return roles
  }

  /**
   * Create/save a new role.
   * POST roles
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {
    const data = request.only(['slug', 'name', 'description'])

    const role = Role.create(data)

    return role
  }

  /**
   * Display a single role.
   * GET roles/:id
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   */
  async show({ params, response, antl }) {
    const role = await Role.find(params.id)

    if (!role) {
      return response.status(404).send({
        error: antl.formatMessage('messages.specialty.not.found'),
      })
    }

    return role
  }

  /**
   * Update role details.
   * PUT or PATCH roles/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response, antl }) {
    const data = request.only(['slug', 'name', 'description'])

    const role = await Role.find(params.id)

    if (!role) {
      return response.status(404).send({
        error: antl.formatMessage('messages.role.not.found'),
      })
    }

    role.merge(data)

    await role.save()

    return role
  }

  /**
   * Delete a role with id.
   * DELETE roles/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response, antl }) {
    const role = await Role.find(params.id)

    if (!role) {
      return response.status(404).send({
        error: antl.formatMessage('messages.role.not.found'),
      })
    }

    await role.delete()
  }
}

module.exports = RoleController
