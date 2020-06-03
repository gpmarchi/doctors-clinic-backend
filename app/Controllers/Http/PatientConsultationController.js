'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */

const Database = use('Database')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Consultation = use('App/Models/Consultation')

/**
 * Resourceful controller for interacting with patient consultations
 */
class PatientConsultationController {
  /**
   * Show a list of all patient consultations.
   * GET /patient/consultations
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * * @param {AuthSession} ctx.auth
   */
  async index({ request, response, auth }) {
    let { start_date, end_date } = request.get()

    if (!start_date) {
      start_date = await Database.from('consultations').getMin('datetime')
    }

    if (!end_date) {
      end_date = await Database.from('consultations').getMax('datetime')
    }

    const loggedUser = await auth.getUser()

    return await Consultation.query()
      .where('patient_id', loggedUser.id)
      .whereBetween('datetime', [start_date, end_date])
      .with('clinic')
      .with('doctor')
      .with('patient')
      .paginate()
  }
}

module.exports = PatientConsultationController
