'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Surgery = use('App/Models/Surgery')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Specialty = use('App/Models/Specialty')

/**
 * Resourceful controller for interacting with surgeries
 */
class SurgeryController {
  /**
   * Show a list of all surgeries.
   * GET surgeries
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index({ request, response }) {
    const surgeries = await Surgery.query().with('specialty').paginate()

    return surgeries
  }

  /**
   * Create/save a new surgery.
   * POST surgeries
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response, antl }) {
    const { specialty_id, ...data } = request.only([
      'name',
      'description',
      'specialty_id',
    ])

    const specialty = await Specialty.find(specialty_id)

    if (!specialty) {
      return response.status(404).send({
        error: antl.formatMessage('messages.specialty.not.found'),
      })
    }

    const surgery = await Surgery.create({ ...data, specialty_id })

    return surgery
  }

  /**
   * Display a single surgery.
   * GET surgeries/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async show({ params, request, response, antl }) {
    const surgery = await Surgery.find(params.id)

    if (!surgery) {
      return response.status(404).send({
        error: antl.formatMessage('messages.surgery.not.found'),
      })
    }

    return surgery
  }

  /**
   * Update surgery details.
   * PUT or PATCH surgeries/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response, antl }) {
    const { specialty_id, ...data } = request.only([
      'name',
      'description',
      'specialty_id',
    ])

    const surgery = await Surgery.find(params.id)

    if (!surgery) {
      return response.status(404).send({
        error: antl.formatMessage('messages.surgery.not.found'),
      })
    }

    const specialty = await Specialty.find(specialty_id)

    if (!specialty) {
      return response.status(404).send({
        error: antl.formatMessage('messages.specialty.not.found'),
      })
    }

    surgery.merge({ ...data, specialty_id })

    await surgery.save()

    return surgery
  }

  /**
   * Delete a surgery with id.
   * DELETE surgeries/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response, antl }) {
    const surgery = await Surgery.find(params.id)

    if (!surgery) {
      return response.status(404).send({
        error: antl.formatMessage('messages.surgery.not.found'),
      })
    }

    await surgery.delete()
  }
}

module.exports = SurgeryController
