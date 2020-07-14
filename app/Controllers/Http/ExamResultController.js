'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */

const Drive = use('Drive')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const File = use('App/Models/File')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const ExamRequest = use('App/Models/ExamRequest')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const ExamResult = use('App/Models/ExamResult')

/**
 * Resourceful controller for interacting with examresults
 */
class ExamResultController {
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
    const { exam_request_id, report_id, ...data } = request.only([
      'short_report',
      'date',
      'exam_request_id',
      'report_id',
    ])

    if (report_id) {
      const report = await File.find(report_id)

      if (!report) {
        return response.status(404).send({
          error: antl.formatMessage(
            'messages.consultation.exam.result.report.not.found'
          ),
        })
      }
    }

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
      report_id,
    })

    await examResult.load('report')

    return examResult
  }

  /**
   * Update examresult details.
   * PUT or PATCH examresults/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async update({ params, request, response, antl, auth }) {
    const examResult = await ExamResult.find(params.id)

    if (!examResult) {
      return response.status(404).send({
        error: antl.formatMessage(
          'messages.consultation.exam.result.not.found'
        ),
      })
    }

    const { report_id, ...data } = request.only([
      'short_report',
      'date',
      'report_id',
    ])

    if (report_id) {
      const report = await File.find(report_id)

      if (!report) {
        return response.status(404).send({
          error: antl.formatMessage(
            'messages.consultation.exam.result.report.not.found'
          ),
        })
      }
    }

    const examRequest = await ExamRequest.find(
      examResult.toJSON().exam_request_id
    )
    await examRequest.load('consultation')

    const loggedUser = await auth.getUser()

    if (loggedUser.id !== examRequest.toJSON().consultation.doctor_id) {
      return response
        .status(401)
        .send({ error: antl.formatMessage('messages.update.unauthorized') })
    }

    examResult.merge({
      ...data,
      report_id: report_id || examResult.report_id,
    })

    await examResult.save()

    await examResult.load('report')

    return examResult
  }

  /**
   * Delete a examresult with id.
   * DELETE examresults/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async destroy({ params, request, response, antl, auth }) {
    const examResult = await ExamResult.find(params.id)

    if (!examResult) {
      return response.status(404).send({
        error: antl.formatMessage(
          'messages.consultation.exam.result.not.found'
        ),
      })
    }

    const examResultData = examResult.toJSON()

    const examRequest = await ExamRequest.find(examResultData.exam_request_id)
    await examRequest.load('consultation')

    const loggedUser = await auth.getUser()

    if (loggedUser.id !== examRequest.toJSON().consultation.doctor_id) {
      return response
        .status(401)
        .send({ error: antl.formatMessage('messages.update.unauthorized') })
    }

    await examResult.delete()

    if (examResultData.report_id) {
      const report = await File.find(examResultData.report_id)

      await report.delete()

      const reportData = report.toJSON()
      await Drive.delete(`${reportData.file}`)
    }
  }
}

module.exports = ExamResultController
