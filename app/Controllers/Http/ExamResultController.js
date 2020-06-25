'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const ExamRequest = use('App/Models/ExamRequest')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const ExamResult = use('App/Models/ExamResult')

/**
 * Resourceful controller for interacting with examresults
 */
class ExamResultController {
  /**
   * Show a list of all examresults.
   * GET examresults
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index({ request, response }) {}

  /**
   * Create/save a new examresult.
   * POST examresults
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async store({ request, response, antl, auth }) {
    const { exam_request_id, ...data } = request.only([
      'short_report',
      'date',
      'exam_request_id',
      'report_id',
    ])

    const examRequest = await ExamRequest.find(exam_request_id)

    if (!examRequest) {
      return response.status(404).send({
        error: antl.formatMessage(
          'messages.consultation.exam.request.not.found'
        ),
      })
    }

    await examRequest.load('consultation')

    const loggedUser = await auth.getUser()

    if (loggedUser.id !== examRequest.toJSON().consultation.doctor_id) {
      return response
        .status(401)
        .send({ error: antl.formatMessage('messages.insert.unauthorized') })
    }

    const examResult = await ExamResult.create({
      ...data,
      exam_request_id,
    })

    await examResult.load('report')

    return examResult
  }

  /**
   * Display a single examresult.
   * GET examresults/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async show({ params, request, response }) {}

  /**
   * Update examresult details.
   * PUT or PATCH examresults/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {}

  /**
   * Delete a examresult with id.
   * DELETE examresults/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {}
}

module.exports = ExamResultController
