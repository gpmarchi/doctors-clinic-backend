'use strict'

const { ioc } = require('@adonisjs/fold')

const Role = ioc.use('Adonis/Acl/Role')
// ioc.use('Adonis/Acl/HasRole')

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Clinic = use('App/Models/Clinic')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Timetable = use('App/Models/Timetable')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Consultation = use('App/Models/Consultation')

const { test, trait, before, beforeEach, after } = use('Test/Suite')(
  'Consultation'
)

trait('Test/ApiClient')
trait('Auth/Client')

let doctor = null
let assistant = null
let patientOne = null
let patientTwo = null
let admin = null
let clinicData = null

const datetime = new Date()

before(async () => {
  await User.truncate()
  await Role.truncate()
  await Clinic.truncate()

  const doctorRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'doctor',
  })

  const assistantRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'assistant',
  })

  const pacientRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'patient',
  })

  const adminRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'administrator',
  })

  doctor = await Factory.model('App/Models/User').create()
  await doctor.roles().attach([doctorRole.id])

  assistant = await Factory.model('App/Models/User').create()
  await assistant.roles().attach([assistantRole.id])

  patientOne = await Factory.model('App/Models/User').create()
  await patientOne.roles().attach([pacientRole.id])

  patientTwo = await Factory.model('App/Models/User').create()
  await patientTwo.roles().attach([pacientRole.id])

  admin = await Factory.model('App/Models/User').create()
  await admin.roles().attach([adminRole.id])

  clinicData = await Factory.model('App/Models/Clinic').create()
})

beforeEach(async () => {
  await Consultation.truncate()
  await Timetable.truncate()
})

after(async () => {
  await doctor.roles().delete()
  await assistant.roles().delete()
  await patientOne.roles().delete()
  await admin.roles().delete()
})

test('it should create a new consultation', async ({ client, assert }) => {
  await Factory.model('App/Models/Timetable').create({
    datetime,
    doctor_id: doctor.id,
    clinic_id: clinicData.id,
  })

  const consultationData = await Factory.model('App/Models/Consultation').make({
    datetime: datetime.getTime(),
    clinic_id: clinicData.id,
    doctor_id: doctor.id,
  })
  const consultation = consultationData.toJSON()

  const response = await client
    .post('/consultations')
    .loginVia(patientOne)
    .send(consultation)
    .end()

  const timetables = (
    await Timetable.query()
      .where({
        datetime: datetime.getTime(),
        doctor_id: doctor.id,
      })
      .fetch()
  ).toJSON()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(response.body.datetime, consultation.datetime)
  assert.equal(response.body.clinic_id, consultation.clinic_id)
  assert.equal(response.body.doctor_id, doctor.id)
  assert.equal(response.body.pacient_id, patientOne.id)
  assert.exists(response.body.clinic)
  assert.exists(response.body.doctor)
  assert.exists(response.body.pacient)
  assert.equal(timetables[0].scheduled, 1)
})

test('it should create a new consultation by assistant', async ({
  client,
  assert,
}) => {
  await Factory.model('App/Models/Timetable').create({
    datetime,
    doctor_id: doctor.id,
    clinic_id: clinicData.id,
  })

  const consultationData = await Factory.model('App/Models/Consultation').make({
    datetime: datetime.getTime(),
    clinic_id: clinicData.id,
    doctor_id: doctor.id,
    patient_id: patientTwo.id,
  })
  const consultation = consultationData.toJSON()

  const response = await client
    .post('/consultations')
    .loginVia(assistant)
    .send(consultation)
    .end()

  const timetables = (
    await Timetable.query()
      .where({
        datetime: datetime.getTime(),
        doctor_id: doctor.id,
      })
      .fetch()
  ).toJSON()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(response.body.datetime, consultation.datetime)
  assert.equal(response.body.clinic_id, consultation.clinic_id)
  assert.equal(response.body.doctor_id, doctor.id)
  assert.equal(response.body.pacient_id, patientTwo.id)
  assert.exists(response.body.clinic)
  assert.exists(response.body.doctor)
  assert.exists(response.body.pacient)
  assert.equal(timetables[0].scheduled, 1)
})

test('it should not create a new consultation for another pacient if not assistant', async ({
  client,
}) => {
  const consultationData = await Factory.model('App/Models/Consultation').make({
    datetime: datetime.getTime(),
    clinic_id: clinicData.id,
    doctor_id: doctor.id,
    patient_id: patientOne.id,
  })
  const consultation = consultationData.toJSON()

  const response = await client
    .post('/consultations')
    .loginVia(patientTwo)
    .send(consultation)
    .end()

  response.assertStatus(401)
})

test('it should not create a new consultation if patient id not provided by assistant', async ({
  client,
}) => {
  const consultationData = await Factory.model('App/Models/Consultation').make({
    datetime: datetime.getTime(),
    clinic_id: clinicData.id,
    doctor_id: doctor.id,
  })
  const consultation = consultationData.toJSON()

  const response = await client
    .post('/consultations')
    .loginVia(assistant)
    .send(consultation)
    .end()

  response.assertStatus(400)
})

test('it should not create a new consultation if clinic does not exists', async ({
  client,
}) => {
  const consultationData = await Factory.model('App/Models/Consultation').make({
    datetime: datetime.getTime(),
    clinic_id: -1,
    doctor_id: doctor.id,
    patient_id: patientOne.id,
  })
  const consultation = consultationData.toJSON()

  const response = await client
    .post('/consultations')
    .loginVia(patientOne)
    .send(consultation)
    .end()

  response.assertStatus(404)
})

test('it should not create a new consultation if doctor does not exists', async ({
  client,
}) => {
  const consultationData = await Factory.model('App/Models/Consultation').make({
    datetime: datetime.getTime(),
    clinic_id: clinicData.id,
    doctor_id: -1,
    patient_id: patientOne.id,
  })
  const consultation = consultationData.toJSON()

  const response = await client
    .post('/consultations')
    .loginVia(patientOne)
    .send(consultation)
    .end()

  response.assertStatus(404)
})

test('it should not create a new consultation if informed doctor user is not a doctor', async ({
  client,
}) => {
  const consultationData = await Factory.model('App/Models/Consultation').make({
    datetime: datetime.getTime(),
    clinic_id: clinicData.id,
    doctor_id: patientTwo.id,
  })
  const consultation = consultationData.toJSON()

  const response = await client
    .post('/consultations')
    .loginVia(patientOne)
    .send(consultation)
    .end()

  response.assertStatus(400)
})

test('it should not create a new consultation if informed patient user by assistant does not exists', async ({
  client,
}) => {
  const consultationData = await Factory.model('App/Models/Consultation').make({
    datetime: datetime.getTime(),
    clinic_id: clinicData.id,
    doctor_id: doctor.id,
    patient_id: -1,
  })
  const consultation = consultationData.toJSON()

  const response = await client
    .post('/consultations')
    .loginVia(assistant)
    .send(consultation)
    .end()

  response.assertStatus(404)
})

test('it should not create a new consultation if informed patient user by assistant is not a patient', async ({
  client,
}) => {
  const consultationData = await Factory.model('App/Models/Consultation').make({
    datetime: datetime.getTime(),
    clinic_id: clinicData.id,
    doctor_id: doctor.id,
    patient_id: doctor.id,
  })
  const consultation = consultationData.toJSON()

  const response = await client
    .post('/consultations')
    .loginVia(assistant)
    .send(consultation)
    .end()

  response.assertStatus(400)
})

test("it should not create a new consultation if doctor's timetable does not exists", async ({
  client,
}) => {
  const consultationData = await Factory.model('App/Models/Consultation').make({
    datetime: new Date(1900, 1, 1, 0, 0, 0, 0).getTime(),
    clinic_id: clinicData.id,
    doctor_id: doctor.id,
  })
  const consultation = consultationData.toJSON()

  const response = await client
    .post('/consultations')
    .loginVia(patientTwo)
    .send(consultation)
    .end()

  response.assertStatus(404)
})

test("it should not create a new consultation if doctor's timetable is already scheduled", async ({
  client,
}) => {
  const datetime = new Date(1800, 1, 1, 0, 0, 0, 0).getTime()

  await Factory.model('App/Models/Timetable').create({
    datetime,
    doctor_id: doctor.id,
    clinic_id: clinicData.id,
    scheduled: true,
  })

  const consultationData = await Factory.model('App/Models/Consultation').make({
    datetime,
    clinic_id: clinicData.id,
    doctor_id: doctor.id,
  })
  const consultation = consultationData.toJSON()

  const response = await client
    .post('/consultations')
    .loginVia(patientTwo)
    .send(consultation)
    .end()

  response.assertStatus(400)
})
