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

const { test, trait, before, beforeEach } = use('Test/Suite')(
  'Consultation Confirmation'
)

trait('Test/ApiClient')
trait('Auth/Client')

let clinic = null
let doctor = null
let patientOne = null
let patientTwo = null

before(async () => {
  await User.truncate()
  await Role.truncate()
  await Clinic.truncate()
  await Database.truncate('role_user')

  const clinicOwner = await Factory.model('App/Models/User').create()
  clinic = await Factory.model('App/Models/Clinic').create({
    owner_id: clinicOwner.id,
  })

  const specialty = await Factory.model('App/Models/Specialty').create()

  const doctorRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'doctor',
  })
  doctor = await Factory.model('App/Models/User').create({
    specialty_id: specialty.id,
  })
  await doctor.roles().attach([doctorRole.id])

  const patientRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'patient',
  })
  patientOne = await Factory.model('App/Models/User').create()
  await patientOne.roles().attach([patientRole.id])

  patientTwo = await Factory.model('App/Models/User').create()
  await patientTwo.roles().attach([patientRole.id])
})

beforeEach(async () => {
  await Consultation.truncate()
})

test("it should confirm a patient's consultation schedule", async ({
  client,
  assert,
}) => {
  const consultation = await Factory.model('App/Models/Consultation').create({
    datetime: new Date(),
    clinic_id: clinic.id,
    doctor_id: doctor.id,
    patient_id: patientOne.id,
  })

  assert.isFalse(consultation.toJSON().confirmed)

  const response = await client
    .patch(`/confirmations/consultation/${consultation.id}`)
    .loginVia(patientOne)
    .send()
    .end()

  assert.isTrue(response.body.confirmed)
})

test('it should not confirm inexistent consultation schedule', async ({
  client,
  assert,
}) => {
  const response = await client
    .patch('/confirmations/consultation/-1')
    .loginVia(patientOne)
    .send()
    .end()

  response.assertStatus(404)
})

test("it should not confirm another patient's consultation schedule", async ({
  client,
  assert,
}) => {
  const consultation = await Factory.model('App/Models/Consultation').create({
    datetime: new Date(),
    clinic_id: clinic.id,
    doctor_id: doctor.id,
    patient_id: patientOne.id,
  })

  assert.isFalse(consultation.toJSON().confirmed)

  const response = await client
    .patch(`/confirmations/consultation/${consultation.id}`)
    .loginVia(patientTwo)
    .send()
    .end()

  response.assertStatus(400)
  assert.equal((await Consultation.find(consultation.id)).toJSON().confirmed, 0)
})
