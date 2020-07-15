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

    await diagnostic.load('prescriptions')

    return diagnostic
  }

  /**
   * Update diagnostic details.
   * PUT or PATCH diagnostics/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async update({ params, request, response, antl, auth }) {
    const { condition_id, surgery_id, operation_date, report } = request.only([
      'report',
      'condition_id',
      'surgery_id',
      'operation_date',
    ])

    const diagnostic = await Diagnostic.find(params.id)

    if (!diagnostic) {
      return response.status(404).send({
        error: antl.formatMessage('messages.consultation.diagnostic.not.found'),
      })
    }

    const loggedUser = await auth.getUser()

    const diagnosticData = diagnostic.toJSON()

    const consultation = await Consultation.find(diagnosticData.consultation_id)

    if (loggedUser.id !== consultation.toJSON().doctor_id) {
      return response
        .status(401)
        .send({ error: antl.formatMessage('messages.update.unauthorized') })
    }

    if (condition_id) {
      const condition = await Condition.find(condition_id)

      if (!condition) {
        return response.status(404).send({
          error: antl.formatMessage('messages.condition.not.found'),
        })
      }
    }

    if (surgery_id) {
      const surgery = await Surgery.find(surgery_id)

      if (!surgery) {
        return response.status(404).send({
          error: antl.formatMessage('messages.surgery.not.found'),
        })
      }

      if (!operation_date && !diagnostic.toJSON().operation_date) {
        return response.status(400).send({
          error: antl.formatMessage('messages.surgery.operation.date'),
        })
      }
    }

    diagnostic.merge({
      report: report || diagnosticData.report,
      condition_id: condition_id || diagnosticData.condition_id,
      surgery_id: surgery_id || diagnosticData.surgery_id,
      operation_date: operation_date || diagnosticData.operation_date,
    })

    await diagnostic.save()

    await diagnostic.load('prescriptions')

    return diagnostic
  }

  /**
   * Delete a diagnostic with id.
   * DELETE diagnostics/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async destroy({ params, request, response, antl, auth }) {
    const diagnostic = await Diagnostic.find(params.id)

    if (!diagnostic) {
      return response.status(404).send({
        error: antl.formatMessage('messages.consultation.diagnostic.not.found'),
      })
    }

    const loggedUser = await auth.getUser()

    const consultation = await Consultation.find(diagnostic.consultation_id)

    if (loggedUser.id !== consultation.toJSON().doctor_id) {
      return response
        .status(401)
        .send({ error: antl.formatMessage('messages.delete.unauthorized') })
    }

    await diagnostic.delete()
  }
}

module.exports = DiagnosticController
