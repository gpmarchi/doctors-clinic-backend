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
const Exam = use('App/Models/Exam')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Consultation = use('App/Models/Consultation')

const { test, trait, before } = use('Test/Suite')('Exam Requests')

trait('Test/ApiClient')
trait('Auth/Client')

let doctorOne = null
let doctorTwo = null
let patientOne = null
let patientTwo = null
let consultation = null
let exams = null

before(async () => {
  await User.query().delete()
  await Role.query().delete()
  await Clinic.query().delete()
  await Exam.query().delete()
  await Consultation.query().delete()
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

  patientOne = await Factory.model('App/Models/User').create()
  await patientOne.roles().attach([patientRole.id])

  patientTwo = await Factory.model('App/Models/User').create()
  await patientTwo.roles().attach([patientRole.id])

  consultation = await Factory.model('App/Models/Consultation').create({
    patient_id: patientOne.id,
    doctor_id: doctorOne.id,
    clinic_id: clinic.id,
  })

  exams = await Factory.model('App/Models/Exam').createMany(4)
})

test("it should save a consultation's exam requests", async ({
  assert,
  client,
}) => {
  const examIds = exams.map((exam) => exam.id)

  const response = await client
    .patch(`/consultation/${consultation.id}/exams`)
    .loginVia(doctorOne)
    .send({
      exams: examIds,
    })
    .end()

  response.assertStatus(200)
  assert.equal(response.body.id, consultation.id)
  assert.exists(response.body.exams)
  assert.equal(response.body.exams.length, 4)
})

test('it should not save exam requests in inexistent consultation', async ({
  assert,
  client,
}) => {
  const examIds = exams.map((exam) => exam.id)

  const response = await client
    .patch('/consultation/-1/exams')
    .loginVia(doctorOne)
    .send({
      exams: examIds,
    })
    .end()

  const originalConsultation = await Consultation.find(consultation.id)
  await originalConsultation.load('exams')

  response.assertStatus(404)
  assert.equal(originalConsultation.exams.length, 0)
})

test("it should not save another doctor consultation's exam requests", async ({
  assert,
  client,
}) => {
  const examIds = exams.map((exam) => exam.id)

  const response = await client
    .patch(`/consultation/${consultation.id}/exams`)
    .loginVia(doctorTwo)
    .send({
      exams: examIds,
    })
    .end()

  const originalConsultation = await Consultation.find(consultation.id)
  await originalConsultation.load('exams')

  response.assertStatus(401)
  assert.equal(originalConsultation.exams.length, 0)
})

test("it should not save a consultation's exam requests if no exams are provided", async ({
  assert,
  client,
}) => {
  const response = await client
    .patch(`/consultation/${consultation.id}/exams`)
    .loginVia(doctorOne)
    .send()
    .end()

  const originalConsultation = await Consultation.find(consultation.id)
  await originalConsultation.load('exams')

  response.assertStatus(400)
  assert.equal(originalConsultation.exams.length, 0)
})
