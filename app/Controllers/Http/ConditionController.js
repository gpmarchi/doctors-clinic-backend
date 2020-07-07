'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Condition = use('App/Models/Condition')

/**
 * Resourceful controller for interacting with conditions
 */
class ConditionController {
  /**
   * Show a list of all conditions.
   * GET conditions
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index({ request, response }) {
    const conditions = await Condition.query().with('specialty').paginate()

    return conditions
  }

  /**
   * Create/save a new condition.
   * POST conditions
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {
    const data = request.only(['name', 'description', 'specialty_id'])

    const condition = await Condition.create(data)

    await condition.load('specialty')

    return condition
  }

  /**
   * Display a single condition.
   * GET conditions/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async show({ params, request, response, antl }) {
    const condition = await Condition.find(params.id)

    if (!condition) {
      return response.status(404).send({
        error: antl.formatMessage('messages.condition.not.found'),
      })
    }

    return condition
  }

  /**
   * Update condition details.
   * PUT or PATCH conditions/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response, antl }) {
    const data = request.only(['name', 'description', 'specialty_id'])

    const condition = await Condition.find(params.id)

    if (!condition) {
      return response.status(404).send({
        error: antl.formatMessage('messages.condition.not.found'),
      })
    }

    condition.merge(data)

    await condition.save()

    await condition.load('specialty')

    return condition
  }

  /**
   * Delete a condition with id.
   * DELETE conditions/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response, antl }) {
    const condition = await Condition.find(params.id)

    if (!condition) {
      return response.status(404).send({
        error: antl.formatMessage('messages.condition.not.found'),
      })
    }

    await condition.delete()
  }
}

module.exports = ConditionController
