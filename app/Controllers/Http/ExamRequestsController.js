'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Consultation = use('App/Models/Consultation')

/**
 * Resourceful controller for interacting with exam requests
 */
class ExamRequestsController {
  /**
   * Update consultation's exam requests details.
   * PUT or PATCH /consultation/:id/exams
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async update({ params, request, response, antl, auth }) {
    const consultation = await Consultation.find(params.id)

    if (!consultation) {
      return response
        .status(404)
        .send({ error: antl.formatMessage('messages.consultation.not.found') })
    }

    const loggedUser = await auth.getUser()

    if (loggedUser.id !== consultation.doctor_id) {
      return response
        .status(401)
        .send({ error: antl.formatMessage('messages.update.unauthorized') })
    }

    const exams = request.input('exams')

    if (!exams) {
      return response.status(400).send({
        error: antl.formatMessage('messages.consultation.exam.requests'),
      })
    }

    await consultation.exams().sync(exams, (row) => (row.date = new Date()))

    await consultation.load('exams')

    return consultation
  }
}

module.exports = ExamRequestsController
