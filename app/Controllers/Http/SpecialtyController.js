'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Specialty = use('App/Models/Specialty')

/**
 * Resourceful controller for interacting with specialties
 */
class SpecialtyController {
  /**
   * Show a list of all specialties.
   * GET specialties
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index({ request, response }) {
    const specialties = await Specialty.all()

    return specialties
  }

  /**
   * Create/save a new specialty.
   * POST specialties
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   */
  async store({ request }) {
    const data = request.only(['name', 'description'])

    const specialty = Specialty.create(data)

    return specialty
  }

  /**
   * Display a single specialty.
   * GET specialties/:id
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   */
  async show({ params, response, antl }) {
    const specialty = await Specialty.find(params.id)

    if (!specialty) {
      return response.status(404).send({
        error: antl.formatMessage('messages.specialty.not.found'),
      })
    }

    return specialty
  }

  /**
   * Update specialty details.
   * PUT or PATCH specialties/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response, antl }) {
    const data = request.only(['name', 'description'])

    const specialty = await Specialty.find(params.id)

    if (!specialty) {
      return response.status(404).send({
        error: antl.formatMessage('messages.specialty.not.found'),
      })
    }

    specialty.merge(data)

    await specialty.save()

    return specialty
  }

  /**
   * Delete a specialty with id.
   * DELETE specialties/:id
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   */
  async destroy({ params, response, antl }) {
    const specialty = await Specialty.find(params.id)

    if (!specialty) {
      return response.status(404).send({
        error: antl.formatMessage('messages.specialty.not.found'),
      })
    }

    await specialty.delete()
  }
}

module.exports = SpecialtyController
