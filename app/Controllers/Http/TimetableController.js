'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Timetable = use('App/Models/Timetable')

/**
 * Resourceful controller for interacting with timetables
 */
class TimetableController {
  /**
   * Show a list of all timetables.
   * GET timetables
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async index({ request, response, auth }) {
    const loggedUser = await auth.getUser()

    if (await loggedUser.is('administrator')) {
      return await Timetable.query().with('clinic').with('doctor').paginate()
    }

    return await Timetable.query()
      .where('doctor_id', loggedUser.id)
      .with('clinic')
      .with('doctor')
      .paginate()
  }

  /**
   * Create/save a new timetable.
   * POST timetables
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async store({ request, response, auth, antl }) {
    const { doctor_id, datetime, clinic_id } = request.all()

    const loggedUser = await auth.getUser()

    if (
      doctor_id &&
      doctor_id !== loggedUser.id &&
      !(await loggedUser.is('administrator'))
    ) {
      return response
        .status(401)
        .send({ error: antl.formatMessage('messages.insert.unauthorized') })
    }

    if (!doctor_id && (await loggedUser.is('administrator'))) {
      return response
        .status(400)
        .send({ error: antl.formatMessage('messages.doctor.id.required') })
    }

    const timetables = (
      await Timetable.query()
        .where({ datetime, doctor_id: doctor_id || loggedUser.id })
        .fetch()
    ).toJSON()

    if (timetables.length > 0) {
      return response.status(400).send({
        error: antl.formatMessage(
          'messages.timetable.datetime.already.registered'
        ),
      })
    }

    const timetable = await Timetable.create({
      clinic_id,
      datetime,
      doctor_id: doctor_id || loggedUser.id,
    })

    await timetable.loadMany(['doctor', 'clinic'])

    return timetable
  }

  /**
   * Display a single timetable.
   * GET timetables/:id
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async show({ params, response, auth, antl }) {
    const timetable = await Timetable.find(params.id)

    if (!timetable) {
      return response.status(404).send({
        error: antl.formatMessage('messages.timetable.not.found'),
      })
    }

    const loggedUser = await auth.getUser()

    if (
      timetable.doctor_id !== loggedUser.id &&
      !(await loggedUser.is('administrator'))
    ) {
      return response.status(401).send({
        error: antl.formatMessage('messages.show.unauthorized'),
      })
    }

    await timetable.loadMany(['clinic', 'doctor'])

    return timetable
  }

  /**
   * Update timetable details.
   * PUT or PATCH timetables/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async update({ params, request, response, auth, antl }) {
    const { doctor_id, ...data } = request.only([
      'datetime',
      'clinic_id',
      'doctor_id',
    ])

    const loggedUser = await auth.getUser()

    const timetable = await Timetable.find(params.id)

    if (!timetable) {
      return response.status(404).send({
        error: antl.formatMessage('messages.timetable.not.found'),
      })
    }

    if (
      timetable.doctor_id !== loggedUser.id &&
      !(await loggedUser.is('administrator'))
    ) {
      return response
        .status(401)
        .send({ error: antl.formatMessage('messages.update.unauthorized') })
    }

    timetable.merge({ ...data, doctor_id: doctor_id || loggedUser.id })

    await timetable.save()

    await timetable.loadMany(['clinic', 'doctor'])

    return timetable
  }

  /**
   * Delete a timetable with id.
   * DELETE timetables/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async destroy({ params, request, response, auth, antl }) {
    const timetable = await Timetable.find(params.id)

    if (!timetable) {
      return response.status(404).send({
        error: antl.formatMessage('messages.timetable.not.found'),
      })
    }

    const loggedUser = await auth.getUser()

    if (
      timetable.doctor_id !== loggedUser.id &&
      !(await loggedUser.is('administrator'))
    ) {
      return response.status(401).send({
        error: antl.formatMessage('messages.delete.unauthorized'),
      })
    }

    timetable.delete()
  }
}

module.exports = TimetableController
