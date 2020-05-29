'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */

const Database = use('Database')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Consultation = use('App/Models/Consultation')

/**
 * Resourceful controller for interacting with pacientconsultations
 */
class DoctorConsultationController {
  /**
   * Show a list of all doctor consultations.
   * GET /doctor/consultations
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async index({ request, response, auth }) {
    let { start_date, end_date, clinic_id, patient_id } = request.get()

    if (!start_date) {
      start_date = await Database.from('consultations').getMin('datetime')
    }

    if (!end_date) {
      end_date = await Database.from('consultations').getMax('datetime')
    }

    const loggedUser = await auth.getUser()

    const query = {
      doctor_id: loggedUser.id,
    }

    if (clinic_id) {
      query.clinic_id = clinic_id
    }

    if (patient_id) {
      query.patient_id = patient_id
    }

    return await Consultation.query()
      .where(query)
      .whereBetween('datetime', [start_date, end_date])
      .with('clinic')
      .with('doctor')
      .with('patient')
      .paginate()
  }
}

module.exports = DoctorConsultationController
