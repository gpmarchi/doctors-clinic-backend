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
const Exam = use('App/Models/Exam')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Consultation = use('App/Models/Consultation')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const ExamRequest = use('App/Models/ExamRequest')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const ExamResult = use('App/Models/ExamResult')

const { test, trait, before, beforeEach, after } = use('Test/Suite')(
  'Exam Result'
)

trait('Test/ApiClient')
trait('Auth/Client')

let doctorOne = null
let doctorTwo = null
let patientOne = null
let patientTwo = null
let consultation = null
let exams = null

before(async () => {
  await User.truncate()
  await Role.truncate()
  await Clinic.truncate()
  await Exam.truncate()
  await Consultation.truncate()
  await ExamRequest.truncate()
  await ExamResult.truncate()

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

  patientOne = await Factory.model('App/Models/User').create()
  await patientOne.roles().attach([patientRole.id])

  patientTwo = await Factory.model('App/Models/User').create()
  await patientTwo.roles().attach([patientRole.id])

  exams = await Factory.model('App/Models/Exam').create()

  consultation = await Factory.model('App/Models/Consultation').create({
    patient_id: patientOne.id,
    doctor_id: doctorOne.id,
    clinic_id: clinic.id,
  })

  await consultation.exams().attach(exams, (row) => (row.date = new Date()))
})

beforeEach(async () => {
  await ExamResult.truncate()
})

after(async () => {
  await doctorOne.roles().delete()
  await doctorTwo.roles().delete()
  await patientOne.roles().delete()
  await patientTwo.roles().delete()
  await consultation.exams().delete()
})

test('it should create an exam result', async ({ assert, client }) => {
  const examRequest = await ExamRequest.findBy(
    'consultation_id',
    consultation.id
  )

  const fileReport = await Factory.model('App/Models/File').create()

  const examResultData = await Factory.model('App/Models/ExamResult').make({
    exam_request_id: examRequest.id,
  })

  const examResult = examResultData.toJSON()

  const response = await client
    .post(`/exam/results`)
    .loginVia(doctorOne)
    .send({ ...examResult, report_id: fileReport.id })
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(response.body.short_report, examResult.short_report)
  assert.equal(
    new Date(response.body.date).getTime(),
    new Date(examResult.date).getTime()
  )
  assert.equal(response.body.report_id, fileReport.id)
  assert.exists(response.body.report)
})

test('it should not create an exam result if request does not exists', async ({
  assert,
  client,
}) => {
  const examRequest = await ExamRequest.findBy(
    'consultation_id',
    consultation.id
  )

  const examResult = await Factory.model('App/Models/ExamResult').make({
    exam_request_id: -1,
  })

  const response = await client
    .post(`/exam/results`)
    .loginVia(doctorOne)
    .send(examResult.toJSON())
    .end()

  await examRequest.load('result')

  response.assertStatus(404)
  assert.notExists(examRequest.toJSON().result)
})

test("it should not create an exam result to another doctor's exam request", async ({
  assert,
  client,
}) => {
  const examRequest = await ExamRequest.findBy(
    'consultation_id',
    consultation.id
  )

  const examResultData = await Factory.model('App/Models/ExamResult').make({
    exam_request_id: examRequest.id,
  })

  const examResult = examResultData.toJSON()

  const response = await client
    .post(`/exam/results`)
    .loginVia(doctorTwo)
    .send(examResult)
    .end()

  await examRequest.load('result')

  response.assertStatus(401)
  assert.notExists(examRequest.toJSON().result)
})
