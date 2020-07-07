'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */

const dateFns = require('date-fns')

const MedicineFrequencyUnit = require('../../Models/Enums/MedicineFrequencyUnit')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Diagnostic = use('App/Models/Diagnostic')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Medicine = use('App/Models/Medicine')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Prescription = use('App/Models/Prescription')

/**
 * Resourceful controller for interacting with prescriptions
 */
class PrescriptionController {
  /**
   * Show a list of all prescriptions.
   * GET prescriptions
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index({ request, response }) {}

  /**
   * Create/save a new prescription.
   * POST prescriptions
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   *
   */
  async store({ request, response, antl, auth }) {
    const {
      medicine_id,
      diagnostic_id,
      expires_on,
      medicine_amount,
      medicine_frequency,
      medicine_frequency_unit,
    } = request.all()

    const diagnostic = await Diagnostic.query()
      .where('id', diagnostic_id)
      .with('consultation')
      .fetch()

    if (!diagnostic) {
      return response.status(404).send({
        error: antl.formatMessage('messages.consultation.diagnostic.not.found'),
      })
    }

    const diagnosticData = diagnostic.toJSON()[0]

    const loggedUser = await auth.getUser()

    if (loggedUser.id !== diagnosticData.consultation.doctor_id) {
      return response
        .status(401)
        .send({ error: antl.formatMessage('messages.insert.unauthorized') })
    }

    const medicine = await Medicine.find(medicine_id)

    if (!medicine) {
      return response.status(404).send({
        error: antl.formatMessage('messages.medicine.not.found'),
      })
    }

    if (
      expires_on &&
      dateFns.isBefore(dateFns.parseISO(expires_on), new Date())
    ) {
      return response.status(400).send({
        error: antl.formatMessage(
          'messages.prescription.invalid.expiration.date'
        ),
      })
    }

    if (medicine_amount <= 0 || medicine_frequency <= 0) {
      return response.status(400).send({
        error: antl.formatMessage(
          'messages.prescription.invalid.medication.frequency'
        ),
      })
    }

    if (
      !Object.prototype.hasOwnProperty.call(
        MedicineFrequencyUnit,
        medicine_frequency_unit
      )
    ) {
      return response.status(400).send({
        error: antl.formatMessage(
          'messages.prescription.invalid.medication.frequency.unit'
        ),
      })
    }

    const prescription = await Prescription.create({
      issued_on: new Date(),
      expires_on,
      medicine_amount,
      medicine_frequency,
      medicine_frequency_unit,
      medicine_id,
      diagnostic_id,
    })

    await prescription.load('medicine')

    return prescription
  }

  /**
   * Display a single prescription.
   * GET prescriptions/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async show({ params, request, response }) {}

  /**
   * Update prescription details.
   * PUT or PATCH prescriptions/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {}

  /**
   * Delete a prescription with id.
   * DELETE prescriptions/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {}
}

module.exports = PrescriptionController
