'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Referral = use('App/Models/Referral')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Specialty = use('App/Models/Specialty')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Consultation = use('App/Models/Consultation')

/**
 * Resourceful controller for interacting with referrals
 */
class ReferralController {
  /**
   * Create/save a new referral.
   * POST referrals
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async store({ request, response, antl, auth }) {
    const { specialty_id, consultation_id } = request.all()

    const specialty = await Specialty.find(specialty_id)

    if (!specialty) {
      return response.status(404).send({
        error: antl.formatMessage('messages.specialty.not.found'),
      })
    }

    const consultation = await Consultation.find(consultation_id)

    if (!consultation) {
      return response.status(404).send({
        error: antl.formatMessage('messages.consultation.not.found'),
      })
    }

    const loggedUser = await auth.getUser()

    if (loggedUser.id !== consultation.doctor_id) {
      return response
        .status(401)
        .send({ error: antl.formatMessage('messages.insert.unauthorized') })
    }

    const referral = await Referral.create({
      date: new Date(),
      specialty_id,
      consultation_id,
    })

    return referral
  }

  /**
   * Update referral details.
   * PUT or PATCH referrals/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async update({ params, request, response, antl, auth }) {
    const specialty_id = request.input('specialty_id')

    const referral = await Referral.find(params.id)

    if (!referral) {
      return response.status(404).send({
        error: antl.formatMessage('messages.referral.not.found'),
      })
    }

    const specialty = await Specialty.find(specialty_id)

    if (!specialty) {
      return response.status(404).send({
        error: antl.formatMessage('messages.specialty.not.found'),
      })
    }

    const consultation = await Consultation.find(referral.consultation_id)

    const loggedUser = await auth.getUser()

    if (loggedUser.id !== consultation.doctor_id) {
      return response
        .status(401)
        .send({ error: antl.formatMessage('messages.insert.unauthorized') })
    }

    referral.merge({ specialty_id })

    await referral.save()

    return referral
  }

  /**
   * Delete a referral with id.
   * DELETE referrals/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {}
}

module.exports = ReferralController
