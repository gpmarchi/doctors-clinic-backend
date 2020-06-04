'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Clinic = use('App/Models/Clinic')

/**
 * Resourceful controller for interacting with schedules
 */
class ClinicScheduleController {
  /**
   * Show a list of all available dates for scheduling in a clinic.
   * GET schedules
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async index({ request, response, antl, auth }) {
    const { clinic_id, specialty_id } = request.get()

    if (!specialty_id) {
      return response.status(400).send({
        error: antl.formatMessage('messages.specialty.not.provided'),
      })
    }

    const loggedUser = await auth.getUser()

    if (!clinic_id && (await loggedUser.is('patient'))) {
      return response.status(400).send({
        error: antl.formatMessage('messages.clinic.not.provided'),
      })
    }

    if (
      (await loggedUser.is('assistant')) &&
      clinic_id &&
      clinic_id !== loggedUser.clinic_id
    ) {
      return response.status(401).send({
        error: antl.formatMessage('messages.show.unauthorized'),
      })
    }

    const clinic = await Clinic.query()
      .where('id', clinic_id || loggedUser.clinic_id)
      .select(['id', 'name'])
      .with('address')
      .with('timetables', (builder) =>
        builder
          .where({ specialty_id, scheduled: false })
          .select(['first_name', 'last_name', 'avatar_id'])
          .orderBy('datetime', 'asc')
          .with('avatar')
      )
      .fetch()

    if (clinic.rows.length === 0) {
      return response.status(404).send({
        error: antl.formatMessage('messages.clinic.not.found'),
      })
    }

    return clinic
  }
}

module.exports = ClinicScheduleController
