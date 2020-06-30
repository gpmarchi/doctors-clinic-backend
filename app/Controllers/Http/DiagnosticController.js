'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Condition = use('App/Models/Condition')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Surgery = use('App/Models/Surgery')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Consultation = use('App/Models/Consultation')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Diagnostic = use('App/Models/Diagnostic')

/**
 * Resourceful controller for interacting with diagnostics
 */
class DiagnosticController {
  /**
   * Show a list of all diagnostics.
   * GET diagnostics
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index({ request, response }) {}

  /**
   * Create/save a new diagnostic.
   * POST diagnostics
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async store({ request, response, antl, auth }) {
    const {
      report,
      consultation_id,
      condition_id,
      surgery_id,
      operation_date,
    } = request.all()

    const consultation = (
      await Consultation.query()
        .where('id', consultation_id)
        .with('diagnostic')
        .fetch()
    ).toJSON()[0]

    if (!consultation) {
      return response.status(404).send({
        error: antl.formatMessage('messages.consultation.not.found'),
      })
    }

    if (consultation.diagnostic) {
      return response.status(400).send({
        error: antl.formatMessage(
          'messages.consultation.diagnostic.already.exists'
        ),
      })
    }

    const loggedUser = await auth.getUser()

    if (loggedUser.id !== consultation.doctor_id) {
      return response
        .status(401)
        .send({ error: antl.formatMessage('messages.insert.unauthorized') })
    }

    const condition = await Condition.find(condition_id)

    if (!condition) {
      return response.status(404).send({
        error: antl.formatMessage('messages.condition.not.found'),
      })
    }

    if (surgery_id) {
      const surgery = await Surgery.find(surgery_id)

      if (!surgery) {
        return response.status(404).send({
          error: antl.formatMessage('messages.surgery.not.found'),
        })
      }

      if (!operation_date) {
        return response.status(400).send({
          error: antl.formatMessage('messages.surgery.operation.date'),
        })
      }
    }

    const diagnostic = await Diagnostic.create({
      report,
      consultation_id,
      condition_id,
      surgery_id,
      operation_date,
    })

    return diagnostic
  }

  /**
   * Display a single diagnostic.
   * GET diagnostics/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async show({ params, request, response }) {}

  /**
   * Update diagnostic details.
   * PUT or PATCH diagnostics/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {}

  /**
   * Delete a diagnostic with id.
   * DELETE diagnostics/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {}
}

module.exports = DiagnosticController
