'use strict'

const dateFns = use('date-fns')

const { ioc } = require('@adonisjs/fold')

const Role = ioc.use('Adonis/Acl/Role')

/** @type {import('@adonisjs/lucid/src/Database')} */
const Database = use('Database')
/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')
const Mail = use('Mail')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Clinic = use('App/Models/Clinic')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Consultation = use('App/Models/Consultation')

const { test, trait, before, beforeEach } = use('Test/Suite')(
  'Doctor Consultation'
)

trait('Test/ApiClient')
trait('Auth/Client')

let doctor = null
let patientOne = null
let patientTwo = null
let clinicOneData = null
let clinicTwoData = null

before(async () => {
  await User.query().delete()
  await Role.query().delete()
  await Clinic.query().delete()
  await Database.truncate('role_user')

  const doctorRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'doctor',
  })

  const patientRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'patient',
  })

  const specialty = await Factory.model('App/Models/Specialty').create()

  doctor = await Factory.model('App/Models/User').create({
    specialty_id: specialty.id,
  })
  await doctor.roles().attach([doctorRole.id])

  patientOne = await Factory.model('App/Models/User').create()
  await patientOne.roles().attach([patientRole.id])

  patientTwo = await Factory.model('App/Models/User').create()
  await patientTwo.roles().attach([patientRole.id])

  const clinicOwner = await Factory.model('App/Models/User').create()

  clinicOneData = await Factory.model('App/Models/Clinic').create({
    owner_id: clinicOwner.id,
  })

  clinicTwoData = await Factory.model('App/Models/Clinic').create({
    owner_id: clinicOwner.id,
  })

  Mail.fake()
})

beforeEach(async () => {
  await Consultation.query().delete()
})

test("it should list all logged in doctor's scheduled consultations", async ({
  client,
  assert,
}) => {
  await Factory.model('App/Models/Consultation').createMany(5, {
    clinic_id: clinicOneData.id,
    doctor_id: doctor.id,
    patient_id: patientOne.id,
  })

  const response = await client
    .get('/doctor/consultations')
    .loginVia(doctor)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.data.length, 5)
})

test("it should list all logged in doctor's scheduled consultations by period", async ({
  client,
  assert,
}) => {
  const startDate = new Date()
  startDate.setHours(8)
  startDate.setMinutes(0)
  startDate.setSeconds(0)
  startDate.setMilliseconds(0)

  const endDate = new Date()
  endDate.setHours(12)
  endDate.setMinutes(0)
  endDate.setSeconds(0)
  endDate.setMilliseconds(0)

  const consultationDate = new Date()
  consultationDate.setHours(10)
  consultationDate.setMinutes(0)
  consultationDate.setSeconds(0)
  consultationDate.setMilliseconds(0)

  await Factory.model('App/Models/Consultation').create({
    datetime: consultationDate,
    clinic_id: clinicOneData.id,
    doctor_id: doctor.id,
    patient_id: patientOne.id,
  })

  await Factory.model('App/Models/Consultation').create({
    datetime: dateFns.addHours(consultationDate, 4),
    clinic_id: clinicOneData.id,
    doctor_id: doctor.id,
    patient_id: patientOne.id,
  })

  const response = await client
    .get('/doctor/consultations')
    .loginVia(doctor)
    .query({ start_date: startDate, end_date: endDate })
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.data.length, 1)
})

test("it should list all logged in doctor's scheduled consultations by clinic", async ({
  client,
  assert,
}) => {
  await Factory.model('App/Models/Consultation').create({
    clinic_id: clinicOneData.id,
    doctor_id: doctor.id,
    patient_id: patientOne.id,
  })

  await Factory.model('App/Models/Consultation').createMany(3, {
    clinic_id: clinicTwoData.id,
    doctor_id: doctor.id,
    patient_id: patientOne.id,
  })

  const response = await client
    .get('/doctor/consultations')
    .loginVia(doctor)
    .query({ clinic_id: clinicTwoData.id })
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.data.length, 3)
})

test("it should list all logged in doctor's scheduled consultations by patient", async ({
  client,
  assert,
}) => {
  await Factory.model('App/Models/Consultation').create({
    clinic_id: clinicOneData.id,
    doctor_id: doctor.id,
    patient_id: patientOne.id,
  })

  await Factory.model('App/Models/Consultation').createMany(3, {
    clinic_id: clinicTwoData.id,
    doctor_id: doctor.id,
    patient_id: patientTwo.id,
  })

  const response = await client
    .get('/doctor/consultations')
    .loginVia(doctor)
    .query({ patient_id: patientTwo.id })
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.data.length, 3)
})
