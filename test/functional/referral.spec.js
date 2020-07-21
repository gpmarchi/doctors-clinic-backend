'use strict'

const { ioc } = require('@adonisjs/fold')

const Role = ioc.use('Adonis/Acl/Role')

/** @type {import('@adonisjs/lucid/src/Database')} */
const Database = use('Database')
/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Clinic = use('App/Models/Clinic')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Consultation = use('App/Models/Consultation')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Referral = use('App/Models/Referral')

const { test, trait, before, beforeEach, after } = use('Test/Suite')('Referral')

trait('Test/ApiClient')
trait('Auth/Client')

let doctorOne
let doctorTwo
let patient
let consultation
let referralSpecialty

before(async () => {
  await User.query().delete()
  await Role.query().delete()
  await Clinic.query().delete()
  await Database.truncate('role_user')
  await Consultation.query().delete()

  const clinicOwner = await Factory.model('App/Models/User').create()

  const clinic = await Factory.model('App/Models/Clinic').create({
    owner_id: clinicOwner.id,
  })

  const doctorRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'doctor',
  })

  const patientRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'patient',
  })

  referralSpecialty = await Factory.model('App/Models/Specialty').create()

  const specialty = await Factory.model('App/Models/Specialty').create()

  doctorOne = await Factory.model('App/Models/User').create({
    specialty_id: specialty.id,
  })
  await doctorOne.roles().attach([doctorRole.id])

  doctorTwo = await Factory.model('App/Models/User').create({
    specialty_id: specialty.id,
  })
  await doctorTwo.roles().attach([doctorRole.id])

  patient = await Factory.model('App/Models/User').create()
  await patient.roles().attach([patientRole.id])

  consultation = await Factory.model('App/Models/Consultation').create({
    clinic_id: clinic.id,
    doctor_id: doctorOne.id,
    patient_id: patient.id,
  })
})

beforeEach(async () => {
  await Referral.query().delete()
})

after(async () => {
  await Consultation.query().delete()
  await Role.query().delete()
  await User.query().delete()
  await Clinic.query().delete()
  await Referral.query().delete()
  await Database.truncate('role_user')
})

test('it should create a new referral', async ({ assert, client }) => {
  const referral = await Factory.model('App/Models/Referral').make({
    specialty_id: referralSpecialty.id,
    consultation_id: consultation.id,
  })

  const referralData = referral.toJSON()

  const response = await client
    .post('/referrals')
    .loginVia(doctorOne)
    .send(referralData)
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.exists(response.body.date)
  assert.equal(response.body.specialty_id, referralData.specialty_id)
  assert.equal(response.body.consultation_id, referralData.consultation_id)
})

test('it should not create a new referral with inexistent specialty', async ({
  assert,
  client,
}) => {
  const referral = await Factory.model('App/Models/Referral').make({
    specialty_id: -1,
    consultation_id: consultation.id,
  })

  const referralData = referral.toJSON()

  const response = await client
    .post('/referrals')
    .loginVia(doctorOne)
    .send(referralData)
    .end()

  response.assertStatus(404)
})

test('it should not create a new referral with inexistent consultation', async ({
  assert,
  client,
}) => {
  const referral = await Factory.model('App/Models/Referral').make({
    specialty_id: referralSpecialty.id,
    consultation_id: -1,
  })

  const referralData = referral.toJSON()

  const response = await client
    .post('/referrals')
    .loginVia(doctorOne)
    .send(referralData)
    .end()

  response.assertStatus(404)
})

test("it should not create a new referral to another doctor's consultation", async ({
  assert,
  client,
}) => {
  const referral = await Factory.model('App/Models/Referral').make({
    specialty_id: referralSpecialty.id,
    consultation_id: consultation.id,
  })

  const referralData = referral.toJSON()

  const response = await client
    .post('/referrals')
    .loginVia(doctorTwo)
    .send(referralData)
    .end()

  response.assertStatus(401)
})
