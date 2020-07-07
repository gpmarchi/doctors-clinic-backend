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
const Condition = use('App/Models/Condition')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Surgery = use('App/Models/Surgery')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Consultation = use('App/Models/Consultation')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Diagnostic = use('App/Models/Diagnostic')

const { test, trait, before, beforeEach } = use('Test/Suite')('Diagnostic')

trait('Test/ApiClient')
trait('Auth/Client')

let doctorOne
let doctorTwo
let patient
let consultation
let conditionOne
let conditionTwo
let surgery

before(async () => {
  await User.truncate()
  await Role.truncate()
  await Clinic.truncate()
  await Consultation.truncate()
  await Surgery.truncate()
  await Condition.truncate()
  await Database.truncate('role_user')

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

  conditionOne = await Factory.model('App/Models/Condition').create({
    specialty_id: specialty.id,
  })

  conditionTwo = await Factory.model('App/Models/Condition').create({
    specialty_id: specialty.id,
  })

  surgery = await Factory.model('App/Models/Surgery').create({
    specialty_id: specialty.id,
  })
})

beforeEach(async () => {
  await Diagnostic.truncate()
})

test('it should create a new diagnostic', async ({ assert, client }) => {
  const diagnostic = await Factory.model('App/Models/Diagnostic').make({
    consultation_id: consultation.id,
    condition_id: conditionOne.id,
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
    condition_id: conditionOne.id,
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
    condition_id: conditionOne.id,
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
    condition_id: conditionOne.id,
  })

  const duplicatedDiagnostic = await Factory.model(
    'App/Models/Diagnostic'
  ).make({
    consultation_id: consultation.id,
    condition_id: conditionOne.id,
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
    condition_id: conditionOne.id,
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
    condition_id: conditionOne.id,
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
    condition_id: conditionOne.id,
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

test('it should update an existing diagnostic', async ({ assert, client }) => {
  const diagnostic = await Factory.model('App/Models/Diagnostic').create({
    consultation_id: consultation.id,
    condition_id: conditionOne.id,
  })

  const diagnosticData = diagnostic.toJSON()
  diagnosticData.report = 'updated report content'

  const response = await client
    .patch(`/diagnostics/${diagnosticData.id}`)
    .loginVia(doctorOne)
    .send(diagnosticData)
    .end()

  response.assertStatus(200)
  assert.equal(response.body.id, diagnosticData.id)
  assert.equal(response.body.report, diagnosticData.report)
  assert.equal(response.body.consultation_id, diagnosticData.consultation_id)
  assert.equal(response.body.condition_id, diagnosticData.condition_id)
})

test("it should update an existing diagnostic's condition", async ({
  assert,
  client,
}) => {
  const diagnostic = await Factory.model('App/Models/Diagnostic').create({
    consultation_id: consultation.id,
    condition_id: conditionOne.id,
  })

  const diagnosticData = diagnostic.toJSON()

  const response = await client
    .patch(`/diagnostics/${diagnosticData.id}`)
    .loginVia(doctorOne)
    .send({ condition_id: conditionTwo.id })
    .end()

  response.assertStatus(200)
  assert.equal(response.body.id, diagnosticData.id)
  assert.equal(response.body.report, diagnosticData.report)
  assert.equal(response.body.consultation_id, diagnosticData.consultation_id)
  assert.equal(response.body.condition_id, conditionTwo.id)
})

test('it should update an existing diagnostic without condition', async ({
  assert,
  client,
}) => {
  const diagnostic = await Factory.model('App/Models/Diagnostic').create({
    consultation_id: consultation.id,
    condition_id: conditionOne.id,
  })

  const diagnosticData = diagnostic.toJSON()
  const report = 'updated report content'

  const response = await client
    .patch(`/diagnostics/${diagnosticData.id}`)
    .loginVia(doctorOne)
    .send({ report })
    .end()

  response.assertStatus(200)
  assert.equal(response.body.id, diagnosticData.id)
  assert.equal(response.body.report, report)
  assert.equal(response.body.consultation_id, diagnosticData.consultation_id)
  assert.equal(response.body.condition_id, diagnosticData.condition_id)
})

test('it should update an existing diagnostic with surgery', async ({
  assert,
  client,
}) => {
  const diagnostic = await Factory.model('App/Models/Diagnostic').create({
    consultation_id: consultation.id,
    condition_id: conditionOne.id,
  })

  const diagnosticData = diagnostic.toJSON()
  diagnosticData.report = 'updated report content'
  diagnosticData.surgery_id = surgery.id
  diagnosticData.operation_date = new Date()

  const response = await client
    .patch(`/diagnostics/${diagnosticData.id}`)
    .loginVia(doctorOne)
    .send(diagnosticData)
    .end()

  response.assertStatus(200)
  assert.equal(response.body.id, diagnosticData.id)
  assert.equal(response.body.report, diagnosticData.report)
  assert.equal(response.body.consultation_id, diagnosticData.consultation_id)
  assert.equal(response.body.condition_id, diagnosticData.condition_id)
  assert.equal(response.body.surgery_id, diagnosticData.surgery_id)
  assert.equal(
    new Date(response.body.operation_date).getTime(),
    new Date(diagnosticData.operation_date).getTime()
  )
})

test('it should not update inexisting diagnostic', async ({ client }) => {
  const response = await client
    .patch('/diagnostics/-1')
    .loginVia(doctorOne)
    .send()
    .end()

  response.assertStatus(404)
})

test("it should not update another doctor's diagnostic", async ({
  assert,
  client,
}) => {
  const diagnostic = await Factory.model('App/Models/Diagnostic').create({
    consultation_id: consultation.id,
    condition_id: conditionOne.id,
  })

  const diagnosticData = diagnostic.toJSON()
  diagnosticData.report = 'updated report content'

  const response = await client
    .patch(`/diagnostics/${diagnosticData.id}`)
    .loginVia(doctorTwo)
    .send(diagnosticData)
    .end()

  const unchangedDiagnostic = await Diagnostic.find(diagnostic.id)

  response.assertStatus(401)
  assert.equal(unchangedDiagnostic.id, diagnosticData.id)
  assert.equal(unchangedDiagnostic.report, diagnostic.toJSON().report)
  assert.equal(
    unchangedDiagnostic.consultation_id,
    diagnosticData.consultation_id
  )
  assert.equal(unchangedDiagnostic.condition_id, diagnosticData.condition_id)
})

test('it should not update an existing diagnostic with inexistent condition', async ({
  assert,
  client,
}) => {
  const diagnostic = await Factory.model('App/Models/Diagnostic').create({
    consultation_id: consultation.id,
    condition_id: conditionOne.id,
  })

  const diagnosticData = diagnostic.toJSON()
  diagnosticData.condition_id = -1

  const response = await client
    .patch(`/diagnostics/${diagnosticData.id}`)
    .loginVia(doctorOne)
    .send(diagnosticData)
    .end()

  const unchangedDiagnostic = await Diagnostic.find(diagnostic.id)

  response.assertStatus(404)
  assert.equal(unchangedDiagnostic.id, diagnosticData.id)
  assert.equal(unchangedDiagnostic.report, diagnostic.toJSON().report)
  assert.equal(
    unchangedDiagnostic.consultation_id,
    diagnostic.toJSON().consultation_id
  )
  assert.equal(
    unchangedDiagnostic.condition_id,
    diagnostic.toJSON().condition_id
  )
})

test('it should not update an existing diagnostic with inexistent surgery', async ({
  assert,
  client,
}) => {
  const diagnostic = await Factory.model('App/Models/Diagnostic').create({
    consultation_id: consultation.id,
    condition_id: conditionOne.id,
  })

  const diagnosticData = diagnostic.toJSON()

  const response = await client
    .patch(`/diagnostics/${diagnosticData.id}`)
    .loginVia(doctorOne)
    .send({ surgery_id: -1 })
    .end()

  const unchangedDiagnostic = await Diagnostic.find(diagnostic.id)

  response.assertStatus(404)
  assert.equal(unchangedDiagnostic.id, diagnosticData.id)
  assert.equal(unchangedDiagnostic.report, diagnosticData.report)
  assert.equal(
    unchangedDiagnostic.consultation_id,
    diagnosticData.consultation_id
  )
  assert.equal(unchangedDiagnostic.condition_id, diagnosticData.condition_id)
})

test("it should not update an existing diagnostic without surgery's operation date", async ({
  assert,
  client,
}) => {
  const diagnostic = await Factory.model('App/Models/Diagnostic').create({
    consultation_id: consultation.id,
    condition_id: conditionOne.id,
  })

  const diagnosticData = diagnostic.toJSON()

  const response = await client
    .patch(`/diagnostics/${diagnosticData.id}`)
    .loginVia(doctorOne)
    .send({ surgery_id: surgery.id })
    .end()

  const unchangedDiagnostic = await Diagnostic.find(diagnostic.id)

  response.assertStatus(400)
  assert.equal(unchangedDiagnostic.id, diagnosticData.id)
  assert.equal(unchangedDiagnostic.report, diagnosticData.report)
  assert.equal(
    unchangedDiagnostic.consultation_id,
    diagnosticData.consultation_id
  )
  assert.equal(unchangedDiagnostic.condition_id, diagnosticData.condition_id)
  assert.notExists(unchangedDiagnostic.surgery_id)
  assert.notExists(unchangedDiagnostic.operation_date)
})
