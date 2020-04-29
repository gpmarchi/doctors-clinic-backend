'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */

const Permission = use('Permission')

/**
 * Resourceful controller for interacting with permissions
 */
class PermissionController {
  /**
   * Show a list of all permissions.
   * GET permissions
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index({ request, response }) {
    const permission = await Permission.all()

    return permission
  }

  /**
   * Create/save a new permission.
   * POST permissions
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {
    const data = request.only(['slug', 'name', 'description'])

    const permission = Permission.create(data)

    return permission
  }

  /**
   * Display a single permission.
   * GET permissions/:id
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   */
  async show({ params, response, antl }) {
    const permission = await Permission.find(params.id)

    if (!permission) {
      return response.status(404).send({
        error: antl.formatMessage('messages.permission.not.found'),
      })
    }

    return permission
  }

  /**
   * Update permission details.
   * PUT or PATCH permissions/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response, antl }) {
    const data = request.only(['slug', 'name', 'description'])

    const permission = await Permission.find(params.id)

    if (!permission) {
      return response.status(404).send({
        error: antl.formatMessage('messages.permission.not.found'),
      })
    }

    permission.merge(data)

    await permission.save()

    return permission
  }

  /**
   * Delete a permission with id.
   * DELETE permissions/:id
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   */
  async destroy({ params, response, antl }) {
    const permission = await Permission.find(params.id)

    if (!permission) {
      return response.status(404).send({
        error: antl.formatMessage('messages.role.not.found'),
      })
    }

    await permission.delete()
  }
}

module.exports = PermissionController
