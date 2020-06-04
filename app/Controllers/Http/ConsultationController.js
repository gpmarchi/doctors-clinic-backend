'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */

const dateFns = use('date-fns')

const Database = use('Database')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Clinic = use('App/Models/Clinic')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Timetable = use('App/Models/Timetable')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Consultation = use('App/Models/Consultation')

/**
 * Resourceful controller for interacting with consultations
 */
class ConsultationController {
  /**
   * Show a list of all consultations.
   * GET consultations
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async index({ request, response, auth }) {
    const { patient_id, doctor_id, clinic_id, is_return } = request.get()

    let { start_date, end_date } = request.get()

    if (!start_date) {
      start_date = await Database.from('consultations').getMin('datetime')
    }

    if (!end_date) {
      end_date = await Database.from('consultations').getMax('datetime')
    }

    const loggedUser = await auth.getUser()

    const query = {}
    query.clinic_id = clinic_id || loggedUser.clinic_id

    if (patient_id) {
      query.patient_id = patient_id
    }

    if (doctor_id) {
      query.doctor_id = doctor_id
    }

    if (is_return) {
      query.is_return = is_return === 'true'
    }

    const consultations = await Consultation.query()
      .where(query)
      .whereBetween('datetime', [start_date, end_date])
      .with('patient')
      .with('doctor')
      .with('clinic')
      .fetch()

    return consultations
  }

  /**
   * Create/save a new consultation.
   * POST consultations
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async store({ request, response, auth, antl }) {
    const {
      clinic_id,
      doctor_id,
      patient_id,
      datetime,
      is_return,
    } = request.all()

    const loggedUser = await auth.getUser()

    if (
      patient_id &&
      patient_id !== loggedUser.id &&
      !(await loggedUser.is('assistant'))
    ) {
      return response
        .status(401)
        .send({ error: antl.formatMessage('messages.insert.unauthorized') })
    }

    if (!patient_id && (await loggedUser.is('assistant'))) {
      return response
        .status(400)
        .send({ error: antl.formatMessage('messages.patient.id.required') })
    }

    const clinic = await Clinic.find(clinic_id)

    if (!clinic) {
      return response
        .status(404)
        .send({ error: antl.formatMessage('messages.clinic.not.found') })
    }

    const doctor = await User.find(doctor_id)

    if (!doctor) {
      return response
        .status(404)
        .send({ error: antl.formatMessage('messages.doctor.not.found') })
    }

    if (!(await doctor.is('doctor'))) {
      return response
        .status(400)
        .send({ error: antl.formatMessage('messages.user.is.not.doctor') })
    }

    if (patient_id) {
      const patient = await User.find(patient_id)

      if (!patient) {
        return response
          .status(404)
          .send({ error: antl.formatMessage('messages.patient.not.found') })
      }

      if (!(await patient.is('patient'))) {
        return response
          .status(400)
          .send({ error: antl.formatMessage('messages.user.is.not.patient') })
      }
    }

    const timetables = (
      await Timetable.query().where({ datetime, doctor_id }).fetch()
    ).toJSON()
    const timetable = timetables[0]

    if (!timetable) {
      return response
        .status(404)
        .send({ error: antl.formatMessage('messages.date.not.available') })
    }

    if (timetable.scheduled) {
      return response
        .status(400)
        .send({ error: antl.formatMessage('messages.date.already.scheduled') })
    }

    const trx = await Database.beginTransaction()

    const consultation = await Consultation.create(
      {
        datetime,
        is_return,
        clinic_id,
        doctor_id,
        patient_id: patient_id || loggedUser.id,
      },
      trx
    )

    const scheduledTimetable = await Timetable.find(timetable.id)
    scheduledTimetable.scheduled = true
    await scheduledTimetable.save(trx)

    trx.commit()

    await consultation.loadMany(['clinic', 'doctor', 'patient'])

    return consultation
  }

  /**
   * Display a single consultation.
   * GET consultations/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async show({ params, request, response }) {}

  /**
   * Update consultation details.
   * PUT or PATCH consultations/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {}

  /**
   * Delete a consultation with id.
   * DELETE consultations/:id
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async destroy({ params, response, antl, auth }) {
    const consultation = await Consultation.find(params.id)

    if (!consultation) {
      return response.status(404).send({
        error: antl.formatMessage('messages.consultation.not.found'),
      })
    }

    const loggedUser = await auth.getUser()

    if (
      !(await loggedUser.is('assistant')) &&
      loggedUser.id !== consultation.patient_id
    ) {
      return response.status(401).send({
        error: antl.formatMessage('messages.consultation.cancel.unauthorized'),
      })
    }

    if (
      (await loggedUser.is('assistant')) &&
      loggedUser.clinic_id !== consultation.clinic_id
    ) {
      return response.status(401).send({
        error: antl.formatMessage('messages.consultation.cancel.unauthorized'),
      })
    }

    const cancelledDate = new Date().getTime()
    const differenceInDays = dateFns.differenceInDays(
      cancelledDate,
      consultation.datetime
    )

    if (differenceInDays < 3) {
      return response.status(400).send({
        error: antl.formatMessage('messages.consultation.cancel.period'),
      })
    }

    const scheduledTimetable = (
      await Timetable.query()
        .where({
          datetime: consultation.datetime,
          doctor_id: consultation.doctor_id,
        })
        .select('id')
        .fetch()
    ).toJSON()[0]

    const trx = await Database.beginTransaction()

    await consultation.delete(trx)

    const timetable = await Timetable.find(scheduledTimetable.id)
    timetable.scheduled = false
    await timetable.save(trx)

    trx.commit()
  }
}

module.exports = ConsultationController
