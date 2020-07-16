'use strict'

const dateFns = require('date-fns')

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
let medicineOne
let medicineTwo

before(async () => {
  await User.query().delete()
  await Role.query().delete()
  await Clinic.query().delete()
  await Database.truncate('role_user')
  await Medicine.query().delete()
  await Condition.query().delete()
  await Diagnostic.query().delete()
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

  medicineOne = await Factory.model('App/Models/Medicine').create()
  medicineTwo = await Factory.model('App/Models/Medicine').create()
})

beforeEach(async () => {
  await Prescription.query().delete()
})

after(async () => {
  await Prescription.query().delete()
  await Medicine.query().delete()
  await Diagnostic.query().delete()
  await Condition.query().delete()
  await Consultation.query().delete()
  await Role.query().delete()
  await User.query().delete()
  await Clinic.query().delete()
  await Database.truncate('role_user')
})

test('it should create a new prescription', async ({ client, assert }) => {
  const prescription = await Factory.model('App/Models/Prescription').make({
    medicine_id: medicineOne.id,
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
  assert.include(response.body.medicine, medicineOne.toJSON())
})

test('it should not create a new prescription to an inexistent diagnostic', async ({
  client,
}) => {
  const prescription = await Factory.model('App/Models/Prescription').make({
    medicine_id: medicineOne.id,
    diagnostic_id: -1,
  })

  const prescriptionData = prescription.toJSON()

  const response = await client
    .post('/prescriptions')
    .loginVia(doctorOne)
    .send(prescriptionData)
    .end()

  response.assertStatus(404)
})

test("it should not create a new prescription to another doctor's diagnostic", async ({
  client,
}) => {
  const prescription = await Factory.model('App/Models/Prescription').make({
    medicine_id: medicineOne.id,
    diagnostic_id: diagnostic.id,
  })

  const prescriptionData = prescription.toJSON()

  const response = await client
    .post('/prescriptions')
    .loginVia(doctorTwo)
    .send(prescriptionData)
    .end()

  response.assertStatus(401)
})

test('it should not create a new prescription with inexistent medicine', async ({
  client,
}) => {
  const prescription = await Factory.model('App/Models/Prescription').make({
    medicine_id: -1,
    diagnostic_id: diagnostic.id,
  })

  const prescriptionData = prescription.toJSON()

  const response = await client
    .post('/prescriptions')
    .loginVia(doctorOne)
    .send(prescriptionData)
    .end()

  response.assertStatus(404)
})

test('it should not create a new prescription if expiration date is invalid', async ({
  client,
}) => {
  const prescription = await Factory.model('App/Models/Prescription').make({
    medicine_id: medicineOne.id,
    diagnostic_id: diagnostic.id,
    expires_on: dateFns.subDays(new Date(), 1),
  })

  const prescriptionData = prescription.toJSON()

  const response = await client
    .post('/prescriptions')
    .loginVia(doctorOne)
    .send(prescriptionData)
    .end()

  response.assertStatus(400)
})

test('it should not create a new prescription if medicine amount is invalid', async ({
  client,
}) => {
  const prescription = await Factory.model('App/Models/Prescription').make({
    medicine_id: medicineOne.id,
    diagnostic_id: diagnostic.id,
    medicine_amount: 0,
  })

  const prescriptionData = prescription.toJSON()

  const response = await client
    .post('/prescriptions')
    .loginVia(doctorOne)
    .send(prescriptionData)
    .end()

  response.assertStatus(400)
})

test('it should not create a new prescription if medicine frequency is invalid', async ({
  client,
}) => {
  const prescription = await Factory.model('App/Models/Prescription').make({
    medicine_id: medicineOne.id,
    diagnostic_id: diagnostic.id,
    medicine_frequency: 0,
  })

  const prescriptionData = prescription.toJSON()

  const response = await client
    .post('/prescriptions')
    .loginVia(doctorOne)
    .send(prescriptionData)
    .end()

  response.assertStatus(400)
})

test('it should not create a new prescription if medicine frequency unit is invalid', async ({
  client,
}) => {
  const prescription = await Factory.model('App/Models/Prescription').make({
    medicine_id: medicineOne.id,
    diagnostic_id: diagnostic.id,
    medicine_frequency_unit: 'SECOND',
  })

  const prescriptionData = prescription.toJSON()

  const response = await client
    .post('/prescriptions')
    .loginVia(doctorOne)
    .send(prescriptionData)
    .end()

  response.assertStatus(400)
})

test("it should update an existing prescription's medicine", async ({
  client,
  assert,
}) => {
  const prescription = await Factory.model('App/Models/Prescription').create({
    issued_on: new Date(),
    medicine_id: medicineOne.id,
    diagnostic_id: diagnostic.id,
  })

  const prescriptionData = prescription.toJSON()

  const response = await client
    .patch(`/prescriptions/${prescriptionData.id}`)
    .loginVia(doctorOne)
    .send({ medicine_id: medicineTwo.id })
    .end()

  response.assertStatus(200)
  assert.equal(response.body.id, prescriptionData.id)
  assert.equal(
    new Date(response.body.issued_on).getTime(),
    new Date(prescriptionData.issued_on).getTime()
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
  assert.equal(response.body.medicine_id, medicineTwo.id)
  assert.equal(response.body.diagnostic_id, prescriptionData.diagnostic_id)
  assert.exists(response.body.medicine)
})

test("it should update an existing prescription's medicine amount", async ({
  client,
  assert,
}) => {
  const prescription = await Factory.model('App/Models/Prescription').create({
    issued_on: new Date(),
    medicine_id: medicineOne.id,
    diagnostic_id: diagnostic.id,
  })

  const prescriptionData = prescription.toJSON()

  const response = await client
    .patch(`/prescriptions/${prescriptionData.id}`)
    .loginVia(doctorOne)
    .send({ medicine_amount: 99 })
    .end()

  response.assertStatus(200)
  assert.equal(response.body.id, prescriptionData.id)
  assert.equal(
    new Date(response.body.issued_on).getTime(),
    new Date(prescriptionData.issued_on).getTime()
  )
  assert.equal(response.body.medicine_amount, 99)
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

test('it should not update an inexisting prescription', async ({
  client,
  assert,
}) => {
  const response = await client
    .patch('/prescriptions/-1')
    .loginVia(doctorOne)
    .send({ medicine_amount: 99 })
    .end()

  response.assertStatus(404)
})

test("it should not update another doctor's diagnostic prescription", async ({
  client,
  assert,
}) => {
  const prescription = await Factory.model('App/Models/Prescription').create({
    issued_on: new Date(),
    medicine_id: medicineOne.id,
    diagnostic_id: diagnostic.id,
  })

  const prescriptionData = prescription.toJSON()

  const response = await client
    .patch(`/prescriptions/${prescription.id}`)
    .loginVia(doctorTwo)
    .send({ medicine_amount: 99 })
    .end()

  const unchangedPrescription = await Prescription.find(prescription.id)

  const unchangedPrescriptionData = unchangedPrescription.toJSON()

  response.assertStatus(401)
  assert.equal(prescriptionData.id, unchangedPrescriptionData.id)
  assert.equal(
    new Date(prescriptionData.issued_on).getTime(),
    new Date(unchangedPrescriptionData.issued_on).getTime()
  )
  assert.equal(
    prescriptionData.medicine_amount,
    unchangedPrescriptionData.medicine_amount
  )
  assert.equal(
    prescriptionData.medicine_frequency,
    unchangedPrescriptionData.medicine_frequency
  )
  assert.equal(
    prescriptionData.medicine_frequency_unit,
    unchangedPrescriptionData.medicine_frequency_unit
  )
  assert.equal(
    prescriptionData.medicine_id,
    unchangedPrescriptionData.medicine_id
  )
  assert.equal(
    prescriptionData.diagnostic_id,
    unchangedPrescriptionData.diagnostic_id
  )
})

test('it should not update prescription with inexistent medicine', async ({
  client,
  assert,
}) => {
  const prescription = await Factory.model('App/Models/Prescription').create({
    issued_on: new Date(),
    medicine_id: medicineOne.id,
    diagnostic_id: diagnostic.id,
  })

  const prescriptionData = prescription.toJSON()

  const response = await client
    .patch(`/prescriptions/${prescription.id}`)
    .loginVia(doctorOne)
    .send({ medicine_id: -1 })
    .end()

  const unchangedPrescription = await Prescription.find(prescription.id)

  const unchangedPrescriptionData = unchangedPrescription.toJSON()

  response.assertStatus(404)
  assert.equal(prescriptionData.id, unchangedPrescriptionData.id)
  assert.equal(
    new Date(prescriptionData.issued_on).getTime(),
    new Date(unchangedPrescriptionData.issued_on).getTime()
  )
  assert.equal(
    prescriptionData.medicine_amount,
    unchangedPrescriptionData.medicine_amount
  )
  assert.equal(
    prescriptionData.medicine_frequency,
    unchangedPrescriptionData.medicine_frequency
  )
  assert.equal(
    prescriptionData.medicine_frequency_unit,
    unchangedPrescriptionData.medicine_frequency_unit
  )
  assert.equal(
    prescriptionData.medicine_id,
    unchangedPrescriptionData.medicine_id
  )
  assert.equal(
    prescriptionData.diagnostic_id,
    unchangedPrescriptionData.diagnostic_id
  )
})

test('it should not update prescription with invalid expiration date', async ({
  client,
  assert,
}) => {
  const prescription = await Factory.model('App/Models/Prescription').create({
    issued_on: new Date(),
    medicine_id: medicineOne.id,
    diagnostic_id: diagnostic.id,
  })

  const prescriptionData = prescription.toJSON()

  const response = await client
    .patch(`/prescriptions/${prescription.id}`)
    .loginVia(doctorOne)
    .send({ expires_on: dateFns.subDays(new Date(), 1) })
    .end()

  const unchangedPrescription = await Prescription.find(prescription.id)

  const unchangedPrescriptionData = unchangedPrescription.toJSON()

  response.assertStatus(400)
  assert.equal(prescriptionData.id, unchangedPrescriptionData.id)
  assert.equal(
    new Date(prescriptionData.issued_on).getTime(),
    new Date(unchangedPrescriptionData.issued_on).getTime()
  )
  assert.equal(
    new Date(prescriptionData.expires_on).getTime(),
    new Date(unchangedPrescriptionData.expires_on).getTime()
  )
  assert.equal(
    prescriptionData.medicine_amount,
    unchangedPrescriptionData.medicine_amount
  )
  assert.equal(
    prescriptionData.medicine_frequency,
    unchangedPrescriptionData.medicine_frequency
  )
  assert.equal(
    prescriptionData.medicine_frequency_unit,
    unchangedPrescriptionData.medicine_frequency_unit
  )
  assert.equal(
    prescriptionData.medicine_id,
    unchangedPrescriptionData.medicine_id
  )
  assert.equal(
    prescriptionData.diagnostic_id,
    unchangedPrescriptionData.diagnostic_id
  )
})

test('it should not update prescription if medicine amount is invalid', async ({
  client,
  assert,
}) => {
  const prescription = await Factory.model('App/Models/Prescription').create({
    issued_on: new Date(),
    medicine_id: medicineOne.id,
    diagnostic_id: diagnostic.id,
  })

  const prescriptionData = prescription.toJSON()

  const response = await client
    .patch(`/prescriptions/${prescription.id}`)
    .loginVia(doctorOne)
    .send({ medicine_amount: 0 })
    .end()

  const unchangedPrescription = await Prescription.find(prescription.id)

  const unchangedPrescriptionData = unchangedPrescription.toJSON()

  response.assertStatus(400)
  assert.equal(prescriptionData.id, unchangedPrescriptionData.id)
  assert.equal(
    new Date(prescriptionData.issued_on).getTime(),
    new Date(unchangedPrescriptionData.issued_on).getTime()
  )
  assert.equal(
    new Date(prescriptionData.expires_on).getTime(),
    new Date(unchangedPrescriptionData.expires_on).getTime()
  )
  assert.equal(
    prescriptionData.medicine_amount,
    unchangedPrescriptionData.medicine_amount
  )
  assert.equal(
    prescriptionData.medicine_frequency,
    unchangedPrescriptionData.medicine_frequency
  )
  assert.equal(
    prescriptionData.medicine_frequency_unit,
    unchangedPrescriptionData.medicine_frequency_unit
  )
  assert.equal(
    prescriptionData.medicine_id,
    unchangedPrescriptionData.medicine_id
  )
  assert.equal(
    prescriptionData.diagnostic_id,
    unchangedPrescriptionData.diagnostic_id
  )
})

test('it should not update prescription if medicine frequency is invalid', async ({
  client,
  assert,
}) => {
  const prescription = await Factory.model('App/Models/Prescription').create({
    issued_on: new Date(),
    medicine_id: medicineOne.id,
    diagnostic_id: diagnostic.id,
  })

  const prescriptionData = prescription.toJSON()

  const response = await client
    .patch(`/prescriptions/${prescription.id}`)
    .loginVia(doctorOne)
    .send({ medicine_frequency: 0 })
    .end()

  const unchangedPrescription = await Prescription.find(prescription.id)

  const unchangedPrescriptionData = unchangedPrescription.toJSON()

  response.assertStatus(400)
  assert.equal(prescriptionData.id, unchangedPrescriptionData.id)
  assert.equal(
    new Date(prescriptionData.issued_on).getTime(),
    new Date(unchangedPrescriptionData.issued_on).getTime()
  )
  assert.equal(
    new Date(prescriptionData.expires_on).getTime(),
    new Date(unchangedPrescriptionData.expires_on).getTime()
  )
  assert.equal(
    prescriptionData.medicine_amount,
    unchangedPrescriptionData.medicine_amount
  )
  assert.equal(
    prescriptionData.medicine_frequency,
    unchangedPrescriptionData.medicine_frequency
  )
  assert.equal(
    prescriptionData.medicine_frequency_unit,
    unchangedPrescriptionData.medicine_frequency_unit
  )
  assert.equal(
    prescriptionData.medicine_id,
    unchangedPrescriptionData.medicine_id
  )
  assert.equal(
    prescriptionData.diagnostic_id,
    unchangedPrescriptionData.diagnostic_id
  )
})

test('it should not update prescription if medicine frequency unit is invalid', async ({
  client,
  assert,
}) => {
  const prescription = await Factory.model('App/Models/Prescription').create({
    issued_on: new Date(),
    medicine_id: medicineOne.id,
    diagnostic_id: diagnostic.id,
  })

  const prescriptionData = prescription.toJSON()

  const response = await client
    .patch(`/prescriptions/${prescription.id}`)
    .loginVia(doctorOne)
    .send({ medicine_frequency_unit: 'SECOND' })
    .end()

  const unchangedPrescription = await Prescription.find(prescription.id)

  const unchangedPrescriptionData = unchangedPrescription.toJSON()

  response.assertStatus(400)
  assert.equal(prescriptionData.id, unchangedPrescriptionData.id)
  assert.equal(
    new Date(prescriptionData.issued_on).getTime(),
    new Date(unchangedPrescriptionData.issued_on).getTime()
  )
  assert.equal(
    new Date(prescriptionData.expires_on).getTime(),
    new Date(unchangedPrescriptionData.expires_on).getTime()
  )
  assert.equal(
    prescriptionData.medicine_amount,
    unchangedPrescriptionData.medicine_amount
  )
  assert.equal(
    prescriptionData.medicine_frequency,
    unchangedPrescriptionData.medicine_frequency
  )
  assert.equal(
    prescriptionData.medicine_frequency_unit,
    unchangedPrescriptionData.medicine_frequency_unit
  )
  assert.equal(
    prescriptionData.medicine_id,
    unchangedPrescriptionData.medicine_id
  )
  assert.equal(
    prescriptionData.diagnostic_id,
    unchangedPrescriptionData.diagnostic_id
  )
})

test('it should delete a prescription', async ({ client, assert }) => {
  const prescription = await Factory.model('App/Models/Prescription').create({
    issued_on: new Date(),
    medicine_id: medicineOne.id,
    diagnostic_id: diagnostic.id,
  })

  const response = await client
    .delete(`/prescriptions/${prescription.id}`)
    .loginVia(doctorOne)
    .send()
    .end()

  const deletedPrescription = await Prescription.find(prescription.id)

  response.assertStatus(204)
  assert.notExists(deletedPrescription)
})

test('it should not delete inexistent prescription', async ({
  client,
  assert,
}) => {
  const response = await client
    .delete('/prescriptions/-1')
    .loginVia(doctorOne)
    .send()
    .end()

  response.assertStatus(404)
})

test("it should not delete another doctor's prescription", async ({
  client,
  assert,
}) => {
  const prescription = await Factory.model('App/Models/Prescription').create({
    issued_on: new Date(),
    medicine_id: medicineOne.id,
    diagnostic_id: diagnostic.id,
  })

  const response = await client
    .delete(`/prescriptions/${prescription.id}`)
    .loginVia(doctorTwo)
    .send()
    .end()

  const deletedPrescription = await Prescription.find(prescription.id)

  response.assertStatus(401)
  assert.exists(deletedPrescription)
})

test("it should list all diagnostic's prescriptions", async ({
  client,
  assert,
}) => {
  await Factory.model('App/Models/Prescription').create({
    issued_on: new Date(),
    medicine_id: medicineOne.id,
    diagnostic_id: diagnostic.id,
  })

  await Factory.model('App/Models/Prescription').create({
    issued_on: new Date(),
    medicine_id: medicineTwo.id,
    diagnostic_id: diagnostic.id,
  })

  const response = await client
    .get('/prescriptions')
    .loginVia(doctorOne)
    .query({ diagnostic_id: diagnostic.id })
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(2, response.body.length)
})

test("it should not list all diagnostic's prescriptions if diagnostic id not provided", async ({
  client,
}) => {
  const response = await client
    .get('/prescriptions')
    .loginVia(doctorOne)
    .send()
    .end()

  response.assertStatus(400)
})

test("it should not list all diagnostic's prescriptions if invalid diagnostic id provided", async ({
  client,
  assert,
}) => {
  await Factory.model('App/Models/Prescription').create({
    issued_on: new Date(),
    medicine_id: medicineOne.id,
    diagnostic_id: diagnostic.id,
  })

  await Factory.model('App/Models/Prescription').create({
    issued_on: new Date(),
    medicine_id: medicineTwo.id,
    diagnostic_id: diagnostic.id,
  })

  const response = await client
    .get('/prescriptions')
    .loginVia(doctorOne)
    .query({ diagnostic_id: -1 })
    .send()
    .end()

  response.assertStatus(404)
})

test("it should not list another doctor diagnostic's prescriptions", async ({
  client,
  assert,
}) => {
  await Factory.model('App/Models/Prescription').create({
    issued_on: new Date(),
    medicine_id: medicineOne.id,
    diagnostic_id: diagnostic.id,
  })

  await Factory.model('App/Models/Prescription').create({
    issued_on: new Date(),
    medicine_id: medicineTwo.id,
    diagnostic_id: diagnostic.id,
  })

  const response = await client
    .get('/prescriptions')
    .loginVia(doctorTwo)
    .query({ diagnostic_id: diagnostic.id })
    .send()
    .end()

  response.assertStatus(401)
})
