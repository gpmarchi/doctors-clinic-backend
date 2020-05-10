'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Medicine = use('App/Models/Medicine')

/**
 * Resourceful controller for interacting with medicines
 */
class MedicineController {
  /**
   * Show a list of all medicines.
   * GET medicines
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index({ request, response }) {
    const medicines = await Medicine.query().with('leaflet').paginate()

    return medicines
  }

  /**
   * Create/save a new medicine.
   * POST medicines
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   */
  async store({ request }) {
    const data = request.only([
      'name',
      'active_ingredient',
      'contra_indications',
      'leaflet_id',
    ])

    const medicine = await Medicine.create(data)

    await medicine.load('leaflet')

    return medicine
  }

  /**
   * Display a single medicine.
   * GET medicines/:id
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   */
  async show({ params, response, antl }) {
    const medicine = await Medicine.find(params.id)

    if (!medicine) {
      return response.status(404).send({
        error: antl.formatMessage('messages.medicine.not.found'),
      })
    }

    await medicine.load('leaflet')

    return medicine
  }

  /**
   * Update medicine details.
   * PUT or PATCH medicines/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response, antl }) {
    const data = request.only([
      'name',
      'active_ingredient',
      'contra_indications',
      'leaflet_id',
    ])

    const medicine = await Medicine.find(params.id)

    if (!medicine) {
      return response.status(404).send({
        error: antl.formatMessage('messages.medicine.not.found'),
      })
    }

    medicine.merge(data)

    await medicine.save()

    await medicine.load('leaflet')

    return medicine
  }

  /**
   * Delete a medicine with id.
   * DELETE medicines/:id
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   */
  async destroy({ params, response, antl }) {
    const medicine = await Medicine.find(params.id)

    if (!medicine) {
      return response.status(404).send({
        error: antl.formatMessage('messages.medicine.not.found'),
      })
    }

    await medicine.delete()
  }
}

module.exports = MedicineController
