'use strict'

const { ioc } = require('@adonisjs/fold')

const Role = ioc.use('Adonis/Acl/Role')

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Clinic = use('App/Models/Clinic')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Consultation = use('App/Models/Consultation')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Medicine = use('App/Models/Medicine')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Condition = use('App/Models/Condition')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Diagnostic = use('App/Models/Diagnostic')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Prescription = use('App/Models/Prescription')

const { test, trait, before, beforeEach, after } = use('Test/Suite')(
  'Prescription'
)

trait('Test/ApiClient')
trait('Auth/Client')

let doctorOne
let doctorTwo
let patient
let diagnostic
let medicine

before(async () => {
  await User.truncate()
  await Role.truncate()
  await Clinic.truncate()
  await Consultation.truncate()
  await Medicine.truncate()
  await Condition.truncate()
  await Diagnostic.truncate()

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

  const consultation = await Factory.model('App/Models/Consultation').create({
    clinic_id: clinic.id,
    doctor_id: doctorOne.id,
    patient_id: patient.id,
  })

  const condition = await Factory.model('App/Models/Condition').create({
    specialty_id: specialty.id,
  })

  diagnostic = await Factory.model('App/Models/Diagnostic').create({
    consultation_id: consultation.id,
    condition_id: condition.id,
  })

  medicine = await Factory.model('App/Models/Medicine').create()
})

beforeEach(async () => {
  await Prescription.truncate()
})

after(async () => {
  await doctorOne.roles().delete()
  await doctorTwo.roles().delete()
  await patient.roles().delete()
})

test('it should create a new prescription', async ({ client, assert }) => {
  const prescription = await Factory.model('App/Models/Prescription').make({
    medicine_id: medicine.id,
    diagnostic_id: diagnostic.id,
  })

  const prescriptionData = prescription.toJSON()

  const response = await client
    .post('/prescriptions')
    .loginVia(doctorOne)
    .send(prescriptionData)
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.exists(response.body.issued_on)
  assert.equal(
    new Date(response.body.expires_on).getTime(),
    new Date(prescriptionData.expires_on).getTime()
  )
  assert.equal(response.body.medicine_amount, prescriptionData.medicine_amount)
  assert.equal(
    response.body.medicine_frequency,
    prescriptionData.medicine_frequency
  )
  assert.equal(
    response.body.medicine_frequency_unit,
    prescriptionData.medicine_frequency_unit
  )
  assert.equal(response.body.medicine_id, prescriptionData.medicine_id)
  assert.equal(response.body.diagnostic_id, prescriptionData.diagnostic_id)
  assert.exists(response.body.medicine)
})
