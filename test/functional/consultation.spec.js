'use strict'

const dateFns = use('date-fns')

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

let doctorOne = null
let doctorTwo = null
let assistant = null
let patientOne = null
let patientTwo = null
let admin = null
let clinicOne = null
let clinicTwo = null

const datetime = new Date()

before(async () => {
  await User.truncate()
  await Role.truncate()
  await Clinic.truncate()

  clinicOne = await Factory.model('App/Models/Clinic').create()
  clinicTwo = await Factory.model('App/Models/Clinic').create()

  const doctorRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'doctor',
  })

  const assistantRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'assistant',
  })

  const patientRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'patient',
  })

  const adminRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'administrator',
  })

  doctorOne = await Factory.model('App/Models/User').create()
  await doctorOne.roles().attach([doctorRole.id])

  doctorTwo = await Factory.model('App/Models/User').create()
  await doctorTwo.roles().attach([doctorRole.id])

  assistant = await Factory.model('App/Models/User').create({
    clinic_id: clinicOne.id,
  })
  await assistant.roles().attach([assistantRole.id])

  patientOne = await Factory.model('App/Models/User').create()
  await patientOne.roles().attach([patientRole.id])

  patientTwo = await Factory.model('App/Models/User').create()
  await patientTwo.roles().attach([patientRole.id])

  admin = await Factory.model('App/Models/User').create()
  await admin.roles().attach([adminRole.id])
})

beforeEach(async () => {
  await Consultation.truncate()
  await Timetable.truncate()
})

after(async () => {
  await doctorOne.roles().delete()
  await assistant.roles().delete()
  await patientOne.roles().delete()
  await admin.roles().delete()
})

test('it should create a new consultation', async ({ client, assert }) => {
  await Factory.model('App/Models/Timetable').create({
    datetime,
    doctor_id: doctorOne.id,
    clinic_id: clinicOne.id,
  })

  const consultationData = await Factory.model('App/Models/Consultation').make({
    datetime: datetime.getTime(),
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
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
        doctor_id: doctorOne.id,
      })
      .fetch()
  ).toJSON()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(response.body.datetime, consultation.datetime)
  assert.equal(response.body.clinic_id, consultation.clinic_id)
  assert.equal(response.body.doctor_id, doctorOne.id)
  assert.equal(response.body.patient_id, patientOne.id)
  assert.exists(response.body.clinic)
  assert.exists(response.body.doctor)
  assert.exists(response.body.patient)
  assert.equal(timetables[0].scheduled, 1)
})

test('it should create a new consultation by assistant', async ({
  client,
  assert,
}) => {
  await Factory.model('App/Models/Timetable').create({
    datetime,
    doctor_id: doctorOne.id,
    clinic_id: clinicOne.id,
  })

  const consultationData = await Factory.model('App/Models/Consultation').make({
    datetime: datetime.getTime(),
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
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
        doctor_id: doctorOne.id,
      })
      .fetch()
  ).toJSON()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(response.body.datetime, consultation.datetime)
  assert.equal(response.body.clinic_id, consultation.clinic_id)
  assert.equal(response.body.doctor_id, doctorOne.id)
  assert.equal(response.body.patient_id, patientTwo.id)
  assert.exists(response.body.clinic)
  assert.exists(response.body.doctor)
  assert.exists(response.body.patient)
  assert.equal(timetables[0].scheduled, 1)
})

test('it should not create a new consultation for another patient if not assistant', async ({
  client,
}) => {
  const consultationData = await Factory.model('App/Models/Consultation').make({
    datetime: datetime.getTime(),
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
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
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
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
    doctor_id: doctorOne.id,
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
    clinic_id: clinicOne.id,
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
    clinic_id: clinicOne.id,
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
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
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
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
    patient_id: doctorOne.id,
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
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
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
    doctor_id: doctorOne.id,
    clinic_id: clinicOne.id,
    scheduled: true,
  })

  const consultationData = await Factory.model('App/Models/Consultation').make({
    datetime,
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
  })
  const consultation = consultationData.toJSON()

  const response = await client
    .post('/consultations')
    .loginVia(patientTwo)
    .send(consultation)
    .end()

  response.assertStatus(400)
})

test('it should list all consultations', async ({ client, assert }) => {
  await Factory.model('App/Models/Consultation').create({
    datetime,
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
  })

  await Factory.model('App/Models/Consultation').create({
    datetime: dateFns.subDays(datetime, 1),
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
  })

  const response = await client
    .get('/consultations')
    .loginVia(assistant)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.length, 2)
  assert.exists(response.body[0].clinic)
  assert.exists(response.body[0].doctor)
  assert.exists(response.body[0].patient)
})

test("it should list all consultations from logged in assistant's clinic by date period", async ({
  client,
  assert,
}) => {
  await Factory.model('App/Models/Consultation').create({
    datetime,
    clinic_id: clinicTwo.id,
    doctor_id: doctorTwo.id,
    patient_id: patientTwo.id,
  })

  await Factory.model('App/Models/Consultation').create({
    datetime,
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
  })

  await Factory.model('App/Models/Consultation').create({
    datetime: dateFns.subDays(datetime, 1),
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
  })

  const start_date = dateFns.subHours(datetime, 4)
  const end_date = dateFns.addHours(datetime, 4)

  const response = await client
    .get('/consultations')
    .loginVia(assistant)
    .query({
      start_date: dateFns.getTime(start_date),
      end_date: dateFns.getTime(end_date),
    })
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.length, 1)
})

test("it should list all consultations from logged in assistant's clinic by patient", async ({
  client,
  assert,
}) => {
  await Factory.model('App/Models/Consultation').create({
    datetime,
    clinic_id: clinicTwo.id,
    doctor_id: doctorTwo.id,
    patient_id: patientOne.id,
  })

  await Factory.model('App/Models/Consultation').createMany(2, {
    datetime,
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
  })

  await Factory.model('App/Models/Consultation').create({
    datetime: dateFns.subDays(datetime, 1),
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
    patient_id: patientTwo.id,
  })

  const response = await client
    .get('/consultations')
    .loginVia(assistant)
    .query({
      patient_id: patientOne.id,
    })
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.length, 2)
})

test("it should list all consultations from logged in assistant's clinic by doctor", async ({
  client,
  assert,
}) => {
  await Factory.model('App/Models/Consultation').create({
    datetime,
    clinic_id: clinicTwo.id,
    doctor_id: doctorOne.id,
    patient_id: patientTwo.id,
  })

  await Factory.model('App/Models/Consultation').createMany(2, {
    datetime,
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
  })

  await Factory.model('App/Models/Consultation').create({
    datetime: dateFns.subDays(datetime, 1),
    clinic_id: clinicOne.id,
    doctor_id: doctorTwo.id,
    patient_id: patientTwo.id,
  })

  const response = await client
    .get('/consultations')
    .loginVia(assistant)
    .query({
      doctor_id: doctorOne.id,
    })
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.length, 2)
})

test("it should list all consultations from logged in assistant's clinic", async ({
  client,
  assert,
}) => {
  await Factory.model('App/Models/Consultation').createMany(2, {
    datetime,
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
  })

  await Factory.model('App/Models/Consultation').create({
    datetime: dateFns.subDays(datetime, 1),
    clinic_id: clinicOne.id,
    doctor_id: doctorTwo.id,
    patient_id: patientTwo.id,
  })

  const response = await client
    .get('/consultations')
    .loginVia(assistant)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.length, 3)
})

test("it should list all return consultations from logged in assistant's clinic", async ({
  client,
  assert,
}) => {
  await Factory.model('App/Models/Consultation').create({
    datetime,
    clinic_id: clinicOne.id,
    doctor_id: doctorTwo.id,
    patient_id: patientTwo.id,
    is_return: true,
  })

  await Factory.model('App/Models/Consultation').createMany(2, {
    datetime,
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
    is_return: true,
  })

  await Factory.model('App/Models/Consultation').create({
    datetime: dateFns.subDays(datetime, 1),
    clinic_id: clinicTwo.id,
    doctor_id: doctorTwo.id,
    patient_id: patientTwo.id,
  })

  const response = await client
    .get('/consultations')
    .loginVia(assistant)
    .query({
      is_return: true,
    })
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.length, 3)
})

test("it should cancel a logged in patient's consultation", async ({
  client,
  assert,
}) => {
  const validTimetableDate = dateFns.subDays(datetime, 4)

  await Factory.model('App/Models/Timetable').create({
    datetime: validTimetableDate,
    doctor_id: doctorOne.id,
    clinic_id: clinicOne.id,
    scheduled: true,
  })

  const consultation = await Factory.model('App/Models/Consultation').create({
    datetime: validTimetableDate,
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
  })

  const response = await client
    .delete(`/consultations/${consultation.id}`)
    .loginVia(patientOne)
    .send()
    .end()

  const timetables = (
    await Timetable.query()
      .where({
        datetime: validTimetableDate.getTime(),
        doctor_id: doctorOne.id,
      })
      .fetch()
  ).toJSON()

  const deletedConsultation = await Consultation.find(consultation.id)

  response.assertStatus(204)
  assert.notExists(deletedConsultation)
  assert.equal(timetables[0].scheduled, 0)
})

test("it should cancel any patient's consultation if assistant", async ({
  client,
  assert,
}) => {
  const validTimetableDate = dateFns.subDays(datetime, 4)

  await Factory.model('App/Models/Timetable').create({
    datetime: validTimetableDate,
    doctor_id: doctorOne.id,
    clinic_id: clinicOne.id,
    scheduled: true,
  })

  const consultation = await Factory.model('App/Models/Consultation').create({
    datetime: validTimetableDate,
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
  })

  const response = await client
    .delete(`/consultations/${consultation.id}`)
    .loginVia(assistant)
    .send()
    .end()

  const timetables = (
    await Timetable.query()
      .where({
        datetime: validTimetableDate.getTime(),
        doctor_id: doctorOne.id,
      })
      .fetch()
  ).toJSON()

  const deletedConsultation = await Consultation.find(consultation.id)

  response.assertStatus(204)
  assert.notExists(deletedConsultation)
  assert.equal(timetables[0].scheduled, 0)
})

test('it should not cancel an inexistent consultation', async ({ client }) => {
  const response = await client
    .delete('/consultations/-1')
    .loginVia(patientOne)
    .send()
    .end()

  response.assertStatus(404)
})

test("it should not cancel another patient's consultation", async ({
  client,
}) => {
  const validTimetableDate = dateFns.subDays(datetime, 4)

  const consultation = await Factory.model('App/Models/Consultation').create({
    datetime: validTimetableDate,
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
  })

  const response = await client
    .delete(`/consultations/${consultation.id}`)
    .loginVia(patientTwo)
    .send()
    .end()

  response.assertStatus(401)
})

test("it should not cancel a logged in patient's consultation if not within cancel timeframe", async ({
  client,
  assert,
}) => {
  await Factory.model('App/Models/Timetable').create({
    datetime,
    doctor_id: doctorOne.id,
    clinic_id: clinicOne.id,
    scheduled: true,
  })

  const consultation = await Factory.model('App/Models/Consultation').create({
    datetime,
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
  })

  const response = await client
    .delete(`/consultations/${consultation.id}`)
    .loginVia(patientOne)
    .send()
    .end()

  const timetables = (
    await Timetable.query()
      .where({
        datetime: datetime.getTime(),
        doctor_id: doctorOne.id,
      })
      .fetch()
  ).toJSON()

  const deletedConsultation = await Consultation.find(consultation.id)

  response.assertStatus(400)
  assert.exists(deletedConsultation)
  assert.equal(timetables[0].scheduled, 1)
})
