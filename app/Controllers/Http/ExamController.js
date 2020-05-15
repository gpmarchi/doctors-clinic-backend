'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Exam = use('App/Models/Exam')

/**
 * Resourceful controller for interacting with exams
 */
class ExamController {
  /**
   * Show a list of all exams.
   * GET exams
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index({ request, response }) {
    const exams = await Exam.query().paginate()

    return exams
  }

  /**
   * Create/save a new exam.
   * POST exams
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   */
  async store({ request }) {
    const data = request.only(['name', 'description'])

    const exam = await Exam.create(data)

    return exam
  }

  /**
   * Display a single exam.
   * GET exams/:id
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   */
  async show({ params, response, antl }) {
    const exam = await Exam.find(params.id)

    if (!exam) {
      return response.status(404).send({
        error: antl.formatMessage('messages.exam.not.found'),
      })
    }

    return exam
  }

  /**
   * Update exam details.
   * PUT or PATCH exams/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response, antl }) {
    const data = request.only(['name', 'description'])

    const exam = await Exam.find(params.id)

    if (!exam) {
      return response.status(404).send({
        error: antl.formatMessage('messages.exam.not.found'),
      })
    }

    exam.merge(data)

    await exam.save()

    return exam
  }

  /**
   * Delete a exam with id.
   * DELETE exams/:id
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   */
  async destroy({ params, response, antl }) {
    const exam = await Exam.find(params.id)

    if (!exam) {
      return response.status(404).send({
        error: antl.formatMessage('messages.exam.not.found'),
      })
    }

    await exam.delete()
  }
}

module.exports = ExamController
