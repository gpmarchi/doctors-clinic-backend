'use strict'

const dateFns = use('date-fns')

const { ioc } = require('@adonisjs/fold')

const Role = ioc.use('Adonis/Acl/Role')
// ioc.use('Adonis/Acl/HasRole')

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')
const Mail = use('Mail')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Clinic = use('App/Models/Clinic')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Consultation = use('App/Models/Consultation')

const { test, trait, before, beforeEach, after } = use('Test/Suite')(
  'Patient Consultation'
)

trait('Test/ApiClient')
trait('Auth/Client')

let doctor = null
let patient = null
let clinicData = null

before(async () => {
  await User.truncate()
  await Role.truncate()
  await Clinic.truncate()

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

  patient = await Factory.model('App/Models/User').create()
  await patient.roles().attach([patientRole.id])

  const clinicOwner = await Factory.model('App/Models/User').create()

  clinicData = await Factory.model('App/Models/Clinic').create({
    owner_id: clinicOwner.id,
  })

  Mail.fake()
})

beforeEach(async () => {
  await Consultation.truncate()
})

after(async () => {
  await doctor.roles().delete()
  await patient.roles().delete()
})

test("it should list all logged in patient's scheduled consultations", async ({
  client,
  assert,
}) => {
  await Factory.model('App/Models/Consultation').createMany(5, {
    clinic_id: clinicData.id,
    doctor_id: doctor.id,
    patient_id: patient.id,
  })

  const response = await client
    .get('/patient/consultations')
    .loginVia(patient)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.data.length, 5)
})

test("it should list all logged in patient's scheduled consultations by period", async ({
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
    clinic_id: clinicData.id,
    doctor_id: doctor.id,
    patient_id: patient.id,
  })

  await Factory.model('App/Models/Consultation').create({
    datetime: dateFns.addHours(consultationDate, 4),
    clinic_id: clinicData.id,
    doctor_id: doctor.id,
    patient_id: patient.id,
  })

  const response = await client
    .get('/patient/consultations')
    .loginVia(patient)
    .query({ start_date: startDate.getTime(), end_date: endDate.getTime() })
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.data.length, 1)
})
