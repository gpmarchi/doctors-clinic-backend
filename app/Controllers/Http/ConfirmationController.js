'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Consultation = use('App/Models/Consultation')

/**
 * Resourceful controller for interacting with consultation confirmations
 */
class ConfirmationController {
  /**
   * Confirm consultations.
   * PUT or PATCH /confirmations/consultation/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async update({ params, response, antl, auth }) {
    const consultation = await Consultation.find(params.id)

    if (!consultation) {
      return response
        .status(404)
        .send({ error: antl.formatMessage('messages.consultation.not.found') })
    }

    const loggedUser = await auth.getUser()

    if (consultation.patient_id !== loggedUser.id) {
      return response
        .status(400)
        .send({ error: antl.formatMessage('messages.update.unauthorized') })
    }

    consultation.merge({
      confirmed: true,
    })

    await consultation.save()

    return consultation
  }
}

module.exports = ConfirmationController
