'use strict'

const dateFns = use('date-fns')

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
const Timetable = use('App/Models/Timetable')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Consultation = use('App/Models/Consultation')

const { test, trait, before, beforeEach, after } = use('Test/Suite')(
  'Consultation'
)

trait('Test/ApiClient')
trait('Auth/Client')

let doctorOne
let doctorTwo
let assistant
let patientOne
let patientTwo
let admin
let clinicOwnerOne
let clinicOwnerTwo
let clinicOne
let clinicTwo

const datetime = new Date()

before(async () => {
  await User.query().delete()
  await Role.query().delete()
  await Clinic.query().delete()
  await Database.truncate('role_user')

  clinicOwnerOne = await Factory.model('App/Models/User').create()
  clinicOwnerTwo = await Factory.model('App/Models/User').create()

  clinicOne = await Factory.model('App/Models/Clinic').create({
    owner_id: clinicOwnerOne.id,
  })

  clinicTwo = await Factory.model('App/Models/Clinic').create({
    owner_id: clinicOwnerTwo.id,
  })

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

  const specialtyOne = await Factory.model('App/Models/Specialty').create()
  const specialtyTwo = await Factory.model('App/Models/Specialty').create()

  doctorOne = await Factory.model('App/Models/User').create({
    specialty_id: specialtyOne.id,
  })
  await doctorOne.roles().attach([doctorRole.id])

  doctorTwo = await Factory.model('App/Models/User').create({
    specialty_id: specialtyTwo.id,
  })
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
  await Consultation.query().delete()
  await Timetable.query().delete()
})

after(async () => {
  await Role.query().delete()
  await Clinic.query().delete()
  await User.query().delete()
  await Database.truncate('role_user')
  await Consultation.query().delete()
  await Timetable.query().delete()
})

test('it should create a new consultation', async ({ client, assert }) => {
  await Factory.model('App/Models/Timetable').create({
    datetime,
    doctor_id: doctorOne.id,
    clinic_id: clinicOne.id,
  })

  const consultationData = await Factory.model('App/Models/Consultation').make({
    datetime,
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
        datetime,
        doctor_id: doctorOne.id,
      })
      .fetch()
  ).toJSON()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(
    new Date(response.body.datetime).getTime(),
    new Date(consultation.datetime).getTime()
  )
  assert.equal(response.body.clinic_id, consultation.clinic_id)
  assert.equal(response.body.doctor_id, doctorOne.id)
  assert.equal(response.body.patient_id, patientOne.id)
  assert.exists(response.body.clinic)
  assert.exists(response.body.doctor)
  assert.exists(response.body.patient)
  assert.equal(timetables[0].scheduled, true)
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
    datetime: datetime,
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
        datetime: datetime,
        doctor_id: doctorOne.id,
      })
      .fetch()
  ).toJSON()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(
    new Date(response.body.datetime).getTime(),
    new Date(consultation.datetime).getTime()
  )
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
    datetime: new Date(1900, 1, 1, 0, 0, 0, 0),
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
  const datetime = new Date(1800, 1, 1, 0, 0, 0, 0)

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

test("it should reschedule a patient's existing consultation", async ({
  client,
  assert,
}) => {
  await Factory.model('App/Models/Timetable').create({
    datetime,
    doctor_id: doctorOne.id,
    clinic_id: clinicOne.id,
    scheduled: true,
  })

  const rescheduledDate = dateFns.addHours(datetime, 4)
  await Factory.model('App/Models/Timetable').create({
    datetime: rescheduledDate,
    doctor_id: doctorTwo.id,
    clinic_id: clinicTwo.id,
    scheduled: false,
  })

  const consultation = await Factory.model('App/Models/Consultation').create({
    datetime,
    patient_id: patientOne.id,
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
  })

  const response = await client
    .patch(`/consultations/${consultation.id}`)
    .loginVia(patientOne)
    .send({
      datetime: rescheduledDate,
      doctor_id: doctorTwo.id,
      clinic_id: clinicTwo.id,
    })
    .end()

  const [oldTimetable] = (
    await Timetable.query()
      .where({
        datetime: datetime,
        doctor_id: doctorOne.id,
      })
      .fetch()
  ).toJSON()

  const [newTimetable] = (
    await Timetable.query()
      .where({
        datetime: rescheduledDate,
        doctor_id: doctorTwo.id,
      })
      .fetch()
  ).toJSON()

  response.assertStatus(200)
  assert.equal(response.body.id, consultation.id)
  assert.equal(
    new Date(response.body.datetime).getTime(),
    rescheduledDate.getTime()
  )
  assert.equal(response.body.clinic_id, clinicTwo.id)
  assert.equal(response.body.doctor_id, doctorTwo.id)
  assert.equal(response.body.patient_id, patientOne.id)
  assert.exists(response.body.clinic)
  assert.exists(response.body.doctor)
  assert.exists(response.body.patient)
  assert.equal(oldTimetable.scheduled, 0)
  assert.equal(newTimetable.scheduled, 1)
})

test("it should reschedule any patient's existing consultation if assistant", async ({
  client,
  assert,
}) => {
  await Factory.model('App/Models/Timetable').create({
    datetime,
    doctor_id: doctorOne.id,
    clinic_id: clinicOne.id,
    scheduled: true,
  })

  const rescheduledDate = dateFns.addHours(datetime, 4)
  await Factory.model('App/Models/Timetable').create({
    datetime: rescheduledDate,
    doctor_id: doctorTwo.id,
    clinic_id: clinicTwo.id,
    scheduled: false,
  })

  const consultation = await Factory.model('App/Models/Consultation').create({
    datetime,
    patient_id: patientOne.id,
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
  })

  const response = await client
    .patch(`/consultations/${consultation.id}`)
    .loginVia(assistant)
    .send({
      datetime: rescheduledDate,
      doctor_id: doctorTwo.id,
      clinic_id: clinicTwo.id,
    })
    .end()

  const [oldTimetable] = (
    await Timetable.query()
      .where({
        datetime: datetime,
        doctor_id: doctorOne.id,
      })
      .fetch()
  ).toJSON()

  const [newTimetable] = (
    await Timetable.query()
      .where({
        datetime: rescheduledDate,
        doctor_id: doctorTwo.id,
      })
      .fetch()
  ).toJSON()

  response.assertStatus(200)
  assert.equal(response.body.id, consultation.id)
  assert.equal(
    new Date(response.body.datetime).getTime(),
    rescheduledDate.getTime()
  )
  assert.equal(response.body.clinic_id, clinicTwo.id)
  assert.equal(response.body.doctor_id, doctorTwo.id)
  assert.equal(response.body.patient_id, patientOne.id)
  assert.exists(response.body.clinic)
  assert.exists(response.body.doctor)
  assert.exists(response.body.patient)
  assert.equal(oldTimetable.scheduled, 0)
  assert.equal(newTimetable.scheduled, 1)
})

test('it should not reschedule inexistent consultation', async ({ client }) => {
  const response = await client
    .patch('/consultations/-1')
    .loginVia(patientOne)
    .send()
    .end()

  response.assertStatus(404)
})

test("it should not reschedule another patient's consultation if not assistant", async ({
  client,
}) => {
  const consultation = await Factory.model('App/Models/Consultation').create({
    datetime: datetime,
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
  })

  const response = await client
    .patch(`/consultations/${consultation.id}`)
    .loginVia(patientTwo)
    .send()
    .end()

  response.assertStatus(400)
})

test('it should not reschedule consultation if doctor does not exists', async ({
  client,
}) => {
  const consultation = await Factory.model('App/Models/Consultation').create({
    datetime: datetime,
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
  })

  const rescheduledConsultation = await Factory.model(
    'App/Models/Consultation'
  ).make({
    clinic_id: clinicOne.id,
    doctor_id: -1,
    patient_id: patientOne.id,
  })

  const response = await client
    .patch(`/consultations/${consultation.id}`)
    .loginVia(patientOne)
    .send(rescheduledConsultation.toJSON())
    .end()

  response.assertStatus(404)
})

test('it should not reschedule consultation if provided doctor is not a doctor', async ({
  client,
}) => {
  const consultation = await Factory.model('App/Models/Consultation').create({
    datetime: datetime,
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
  })

  const rescheduledConsultation = await Factory.model(
    'App/Models/Consultation'
  ).make({
    clinic_id: clinicOne.id,
    doctor_id: patientTwo.id,
    patient_id: patientOne.id,
  })

  const response = await client
    .patch(`/consultations/${consultation.id}`)
    .loginVia(patientOne)
    .send(rescheduledConsultation.toJSON())
    .end()

  response.assertStatus(400)
})

test('it should not reschedule consultation if clinic does not exists', async ({
  client,
}) => {
  const consultation = await Factory.model('App/Models/Consultation').create({
    datetime: datetime,
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
  })

  const rescheduledConsultation = await Factory.model(
    'App/Models/Consultation'
  ).make({
    clinic_id: -1,
  })

  const response = await client
    .patch(`/consultations/${consultation.id}`)
    .loginVia(patientOne)
    .send(rescheduledConsultation.toJSON())
    .end()

  response.assertStatus(404)
})

test('it should not reschedule consultation if new schedule does not exists', async ({
  client,
}) => {
  const consultation = await Factory.model('App/Models/Consultation').create({
    datetime: datetime,
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
  })

  const rescheduledConsultation = await Factory.model(
    'App/Models/Consultation'
  ).make({
    doctor_id: doctorOne.id,
    datetime: new Date(),
  })

  const response = await client
    .patch(`/consultations/${consultation.id}`)
    .loginVia(patientOne)
    .send(rescheduledConsultation.toJSON())
    .end()

  response.assertStatus(404)
})

test('it should not reschedule consultation if new schedule is already taken', async ({
  client,
}) => {
  const rescheduledDate = dateFns.addHours(datetime, 4)
  await Factory.model('App/Models/Timetable').create({
    datetime: rescheduledDate,
    scheduled: true,
    doctor_id: doctorTwo.id,
    clinic_id: clinicTwo.id,
  })

  const consultation = await Factory.model('App/Models/Consultation').create({
    datetime: datetime,
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
  })

  const rescheduledConsultation = await Factory.model(
    'App/Models/Consultation'
  ).make({
    datetime: rescheduledDate,
    doctor_id: doctorTwo.id,
    clinic_id: clinicTwo.id,
  })

  const response = await client
    .patch(`/consultations/${consultation.id}`)
    .loginVia(patientOne)
    .send(rescheduledConsultation.toJSON())
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
      start_date: start_date,
      end_date: end_date,
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

test("it should show any assistant's clinic consultation by id if assistant", async ({
  client,
  assert,
}) => {
  const consultation = await Factory.model('App/Models/Consultation').create({
    datetime,
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
    is_return: false,
  })

  const response = await client
    .get(`/consultations/${consultation.id}`)
    .loginVia(assistant)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.id, consultation.id)
  assert.exists(response.body.patient)
  assert.exists(response.body.doctor)
  assert.exists(response.body.clinic)
  assert.isEmpty(response.body.exams)
  assert.notExists(response.body.diagnostic)
})

test("it should show patient's consultation by id if patient", async ({
  client,
  assert,
}) => {
  const consultation = await Factory.model('App/Models/Consultation').create({
    datetime,
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
    is_return: false,
  })

  const response = await client
    .get(`/consultations/${consultation.id}`)
    .loginVia(patientOne)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.id, consultation.id)
  assert.exists(response.body.patient)
  assert.exists(response.body.doctor)
  assert.exists(response.body.clinic)
  assert.isEmpty(response.body.exams)
  assert.notExists(response.body.diagnostic)
})

test("it should show doctor's consultation by id if doctor", async ({
  client,
  assert,
}) => {
  const consultation = await Factory.model('App/Models/Consultation').create({
    datetime,
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
    is_return: false,
  })

  const response = await client
    .get(`/consultations/${consultation.id}`)
    .loginVia(doctorOne)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.id, consultation.id)
  assert.exists(response.body.patient)
  assert.exists(response.body.doctor)
  assert.exists(response.body.clinic)
  assert.isEmpty(response.body.exams)
  assert.notExists(response.body.diagnostic)
})

test('it should not show inexistent consultation', async ({ client }) => {
  const response = await client
    .get('/consultations/-1')
    .loginVia(assistant)
    .send()
    .end()

  response.assertStatus(404)
})

test("it should not show another assistant clinic's consultation by id if assistant", async ({
  client,
  assert,
}) => {
  const consultation = await Factory.model('App/Models/Consultation').create({
    datetime,
    clinic_id: clinicTwo.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
    is_return: false,
  })

  const response = await client
    .get(`/consultations/${consultation.id}`)
    .loginVia(assistant)
    .send()
    .end()

  response.assertStatus(401)
})

test("it should not show another patient's consultation by id if patient", async ({
  client,
  assert,
}) => {
  const consultation = await Factory.model('App/Models/Consultation').create({
    datetime,
    clinic_id: clinicTwo.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
    is_return: false,
  })

  const response = await client
    .get(`/consultations/${consultation.id}`)
    .loginVia(patientTwo)
    .send()
    .end()

  response.assertStatus(401)
})

test("it should not show another doctor's consultation by id if doctor", async ({
  client,
  assert,
}) => {
  const consultation = await Factory.model('App/Models/Consultation').create({
    datetime,
    clinic_id: clinicTwo.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
    is_return: false,
  })

  const response = await client
    .get(`/consultations/${consultation.id}`)
    .loginVia(doctorTwo)
    .send()
    .end()

  response.assertStatus(401)
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
        datetime: validTimetableDate,
        doctor_id: doctorOne.id,
      })
      .fetch()
  ).toJSON()

  const deletedConsultation = await Consultation.find(consultation.id)

  response.assertStatus(204)
  assert.notExists(deletedConsultation)
  assert.equal(timetables[0].scheduled, false)
})

test("it should cancel any patient's consultation in my clinic if assistant", async ({
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
        datetime: validTimetableDate,
        doctor_id: doctorOne.id,
      })
      .fetch()
  ).toJSON()

  const deletedConsultation = await Consultation.find(consultation.id)

  response.assertStatus(204)
  assert.notExists(deletedConsultation)
  assert.equal(timetables[0].scheduled, false)
})

test("it should not cancel any patient's consultation not in my clinic if assistant", async ({
  client,
  assert,
}) => {
  const validTimetableDate = dateFns.subDays(datetime, 4)

  const consultation = await Factory.model('App/Models/Consultation').create({
    datetime: validTimetableDate,
    clinic_id: clinicTwo.id,
    doctor_id: doctorOne.id,
    patient_id: patientOne.id,
  })

  const response = await client
    .delete(`/consultations/${consultation.id}`)
    .loginVia(assistant)
    .send()
    .end()

  const deletedConsultation = await Consultation.find(consultation.id)

  response.assertStatus(401)
  assert.exists(deletedConsultation)
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
        datetime: datetime,
        doctor_id: doctorOne.id,
      })
      .fetch()
  ).toJSON()

  const deletedConsultation = await Consultation.find(consultation.id)

  response.assertStatus(400)
  assert.exists(deletedConsultation)
  assert.equal(timetables[0].scheduled, true)
})
