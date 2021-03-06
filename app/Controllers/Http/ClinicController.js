'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/auth/src/Schemes/Session')} AuthSession */

const { validate } = use('Validator')
const AddressValidator = use('App/Validators/Address')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Clinic = use('App/Models/Clinic')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Address = use('App/Models/Address')

/**
 * Resourceful controller for interacting with clinics
 */
class ClinicController {
  /**
   * Show a list of all clinics.
   * GET clinics
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async index({ response, auth }) {
    const loggedUser = await auth.getUser()

    const clinics = await Clinic.query()
      .where('owner_id', loggedUser.id)
      .with('address')
      .with('owner')
      .with('specialties')
      .paginate()

    return clinics
  }

  /**
   * Create/save a new clinic.
   * POST clinics
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async store({ request, response, antl, auth }) {
    const { address, specialties, ...data } = request.only([
      'name',
      'phone',
      'cnpj',
      'address',
      'specialties',
    ])

    const owner = await auth.getUser()

    const clinic = await Clinic.create({ ...data, owner_id: owner.id })

    if (address) {
      const validation = await validate(
        address,
        new AddressValidator().rules,
        antl.list('validation')
      )

      if (validation.fails()) {
        return response.status(400).send(validation.messages())
      }

      await clinic.address().create(address)
    }

    if (specialties) {
      await clinic.specialties().attach(specialties)
    }

    await clinic.loadMany(['address', 'owner', 'specialties'])

    return clinic
  }

  /**
   * Display a single clinic.
   * GET clinics/:id
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async show({ params, response, antl, auth }) {
    const clinic = await Clinic.find(params.id)

    if (!clinic) {
      return response.status(404).send({
        error: antl.formatMessage('messages.user.not.found'),
      })
    }

    const loggedUser = await auth.getUser()

    if (clinic.owner_id !== loggedUser.id) {
      return response.status(403).send({
        error: antl.formatMessage('messages.show.unauthorized'),
      })
    }

    await clinic.loadMany(['address', 'owner', 'specialties'])

    return clinic
  }

  /**
   * Update clinic details.
   * PUT or PATCH clinics/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async update({ params, request, response, antl, auth }) {
    const { address, specialties, ...data } = request.only([
      'name',
      'phone',
      'cnpj',
      'address',
      'specialties',
    ])

    const loggedUser = await auth.getUser()

    const clinic = await Clinic.find(params.id)

    if (!clinic) {
      return response.status(404).send({
        error: antl.formatMessage('messages.clinic.not.found'),
      })
    }

    if (clinic.owner_id !== loggedUser.id) {
      return response.status(403).send({
        error: antl.formatMessage('messages.update.unauthorized'),
      })
    }

    clinic.merge(data)

    await clinic.save()

    if (address) {
      const validation = await validate(
        address,
        new AddressValidator().rules,
        antl.list('validation')
      )

      if (validation.fails()) {
        return response.status(400).send(validation.messages())
      }

      const savedAddress = await Address.findBy('clinic_id', clinic.id)

      if (savedAddress) {
        savedAddress.merge(address)
        await savedAddress.save()
      } else {
        await Address.create({ ...address, clinic_id: clinic.id })
      }
    }

    if (specialties) {
      await clinic.specialties().sync(specialties)
    }

    await clinic.loadMany(['address', 'owner', 'specialties'])

    return clinic
  }

  /**
   * Delete a clinic with id.
   * DELETE clinics/:id
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   * @param {AuthSession} ctx.auth
   */
  async destroy({ params, response, antl, auth }) {
    const clinic = await Clinic.find(params.id)

    if (!clinic) {
      return response.status(404).send({
        error: antl.formatMessage('messages.clinic.not.found'),
      })
    }

    const loggedUser = await auth.getUser()

    if (clinic.owner_id !== loggedUser.id) {
      return response.status(403).send({
        error: antl.formatMessage('messages.delete.unauthorized'),
      })
    }

    clinic.delete()
  }
}

module.exports = ClinicController
