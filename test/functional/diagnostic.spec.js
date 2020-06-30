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
const Condition = use('App/Models/Condition')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Surgery = use('App/Models/Surgery')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Consultation = use('App/Models/Consultation')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Diagnostic = use('App/Models/Diagnostic')

const { test, trait, before, beforeEach, after } = use('Test/Suite')(
  'Diagnostic'
)

trait('Test/ApiClient')
trait('Auth/Client')

let doctorOne
let doctorTwo
let patient
let consultation
let condition
let surgery

before(async () => {
  await User.truncate()
  await Role.truncate()
  await Clinic.truncate()
  await Consultation.truncate()
  await Surgery.truncate()
  await Condition.truncate()

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

  consultation = await Factory.model('App/Models/Consultation').create({
    patient_id: patient.id,
    doctor_id: doctorOne.id,
    clinic_id: clinic.id,
  })

  condition = await Factory.model('App/Models/Condition').create({
    specialty_id: specialty.id,
  })

  surgery = await Factory.model('App/Models/Surgery').create({
    specialty_id: specialty.id,
  })
})

beforeEach(async () => {
  await Diagnostic.truncate()
})

after(async () => {
  await doctorOne.roles().delete()
  await doctorTwo.roles().delete()
  await patient.roles().delete()
})

test('it should create a new diagnostic', async ({ assert, client }) => {
  const diagnostic = await Factory.model('App/Models/Diagnostic').make({
    consultation_id: consultation.id,
    condition_id: condition.id,
  })

  const diagnosticData = diagnostic.toJSON()

  const response = await client
    .post('/diagnostics')
    .loginVia(doctorOne)
    .send(diagnosticData)
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(response.body.report, diagnosticData.report)
  assert.equal(response.body.consultation_id, diagnosticData.consultation_id)
  assert.exists(response.body.condition_id, diagnosticData.condition_id)
})

test('it should create a new diagnostic with surgery', async ({
  assert,
  client,
}) => {
  const operation_date = new Date()

  const diagnostic = await Factory.model('App/Models/Diagnostic').make({
    consultation_id: consultation.id,
    condition_id: condition.id,
    surgery_id: surgery.id,
    operation_date,
  })

  const diagnosticData = diagnostic.toJSON()

  const response = await client
    .post('/diagnostics')
    .loginVia(doctorOne)
    .send(diagnosticData)
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(response.body.report, diagnosticData.report)
  assert.equal(response.body.consultation_id, diagnosticData.consultation_id)
  assert.exists(response.body.condition_id, diagnosticData.condition_id)
  assert.exists(response.body.surgery_id, diagnosticData.surgery_id)
  assert.exists(response.body.operation_date, diagnosticData.operation_date)
})

test('it should not create a new diagnostic for invalid consultation', async ({
  client,
}) => {
  const diagnostic = await Factory.model('App/Models/Diagnostic').make({
    consultation_id: -1,
    condition_id: condition.id,
  })

  const diagnosticData = diagnostic.toJSON()

  const response = await client
    .post('/diagnostics')
    .loginVia(doctorOne)
    .send(diagnosticData)
    .end()

  response.assertStatus(404)
})

test('it should not create a new diagnostic for a consultation that already has one', async ({
  client,
}) => {
  await Factory.model('App/Models/Diagnostic').create({
    consultation_id: consultation.id,
    condition_id: condition.id,
  })

  const duplicatedDiagnostic = await Factory.model(
    'App/Models/Diagnostic'
  ).make({
    consultation_id: consultation.id,
    condition_id: condition.id,
  })

  const duplicatedDiagnosticData = duplicatedDiagnostic.toJSON()

  const response = await client
    .post('/diagnostics')
    .loginVia(doctorOne)
    .send(duplicatedDiagnosticData)
    .end()

  response.assertStatus(400)
})

test("it should not create a new diagnostic to another doctor's consultation", async ({
  assert,
  client,
}) => {
  const diagnostic = await Factory.model('App/Models/Diagnostic').make({
    consultation_id: consultation.id,
    condition_id: condition.id,
  })

  const diagnosticData = diagnostic.toJSON()

  const response = await client
    .post('/diagnostics')
    .loginVia(doctorTwo)
    .send(diagnosticData)
    .end()

  response.assertStatus(401)
})

test('it should not create a new diagnostic with inexistent condition', async ({
  assert,
  client,
}) => {
  const diagnostic = await Factory.model('App/Models/Diagnostic').make({
    consultation_id: consultation.id,
    condition_id: -1,
  })

  const diagnosticData = diagnostic.toJSON()

  const response = await client
    .post('/diagnostics')
    .loginVia(doctorOne)
    .send(diagnosticData)
    .end()

  response.assertStatus(404)
})

test('it should not create a new diagnostic with inexistent surgery', async ({
  assert,
  client,
}) => {
  const operation_date = new Date()

  const diagnostic = await Factory.model('App/Models/Diagnostic').make({
    consultation_id: consultation.id,
    condition_id: condition.id,
    surgery_id: -1,
    operation_date,
  })

  const diagnosticData = diagnostic.toJSON()

  const response = await client
    .post('/diagnostics')
    .loginVia(doctorOne)
    .send(diagnosticData)
    .end()

  response.assertStatus(404)
})

test('it should not create a new diagnostic without surgery operation date', async ({
  assert,
  client,
}) => {
  const diagnostic = await Factory.model('App/Models/Diagnostic').make({
    consultation_id: consultation.id,
    condition_id: condition.id,
    surgery_id: surgery.id,
  })

  const diagnosticData = diagnostic.toJSON()

  const response = await client
    .post('/diagnostics')
    .loginVia(doctorOne)
    .send(diagnosticData)
    .end()

  response.assertStatus(400)
})
