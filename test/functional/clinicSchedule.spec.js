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
const Specialty = use('App/Models/Specialty')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Clinic = use('App/Models/Clinic')

const { test, trait, before } = use('Test/Suite')('Clinic Schedule')

trait('Test/ApiClient')
trait('Auth/Client')

let patient = null
let doctorOne = null
let doctorTwo = null
let specialtyOne = null
let clinicOne = null
let clinicTwo = null
let assistant = null

before(async () => {
  await User.query().delete()
  await Role.query().delete()
  await Specialty.query().delete()
  await Clinic.query().delete()
  await Database.truncate('role_user')

  const patientRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'patient',
  })
  const doctorRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'doctor',
  })
  const assistantRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'assistant',
  })

  specialtyOne = await Factory.model('App/Models/Specialty').create()
  const specialtyTwo = await Factory.model('App/Models/Specialty').create()

  patient = await Factory.model('App/Models/User').create()
  await patient.roles().attach([patientRole.toJSON().id])

  doctorOne = await Factory.model('App/Models/User').create({
    specialty_id: specialtyOne.id,
  })
  await doctorOne.roles().attach([doctorRole.toJSON().id])

  doctorTwo = await Factory.model('App/Models/User').create({
    specialty_id: specialtyTwo.id,
  })
  await doctorTwo.roles().attach([doctorRole.toJSON().id])

  clinicOne = await Factory.model('App/Models/Clinic').create()
  await clinicOne.specialties().attach([specialtyOne.id, specialtyTwo.id])

  clinicTwo = await Factory.model('App/Models/Clinic').create()
  await clinicTwo.specialties().attach([specialtyOne.id, specialtyTwo.id])

  assistant = await Factory.model('App/Models/User').create({
    clinic_id: clinicOne.id,
  })
  await assistant.roles().attach([assistantRole.id])

  await Factory.model('App/Models/Timetable').createMany(2, {
    clinic_id: clinicOne.id,
    doctor_id: doctorOne.id,
  })

  await Factory.model('App/Models/Timetable').createMany(3, {
    clinic_id: clinicOne.id,
    doctor_id: doctorTwo.id,
  })

  await Factory.model('App/Models/Timetable').createMany(3, {
    clinic_id: clinicTwo.id,
    doctor_id: doctorOne.id,
  })
})

test('it should return the clinic with a list of doctors filtered by specialty with available timetables', async ({
  client,
  assert,
}) => {
  const response = await client
    .get('/schedules')
    .loginVia(patient)
    .query({ specialty_id: specialtyOne.id, clinic_id: clinicOne.id })
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body[0].timetables.length, 2)
})

test("it should return the assistant's clinic with a list of doctors filtered by specialty with available timetables", async ({
  client,
  assert,
}) => {
  const response = await client
    .get('/schedules')
    .loginVia(assistant)
    .query({ specialty_id: specialtyOne.id })
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body[0].timetables.length, 2)
})

test('it should not return another clinic with available timetables if assistant', async ({
  client,
  assert,
}) => {
  const response = await client
    .get('/schedules')
    .loginVia(assistant)
    .query({ specialty_id: specialtyOne.id, clinic_id: clinicTwo.id })
    .send()
    .end()

  response.assertStatus(401)
})

test('it should not return the clinic with available timetables if specialty not provided', async ({
  client,
  assert,
}) => {
  const response = await client
    .get('/schedules')
    .loginVia(patient)
    .query({ clinic_id: clinicOne.id })
    .send()
    .end()

  response.assertStatus(400)
})

test('it should not return the clinic with available timetables if clinic not provided by pacient', async ({
  client,
  assert,
}) => {
  const response = await client
    .get('/schedules')
    .loginVia(patient)
    .query({ specialty_id: specialtyOne.id })
    .send()
    .end()

  response.assertStatus(400)
})

test('it should not return inexistent clinic with available timetables', async ({
  client,
  assert,
}) => {
  const response = await client
    .get('/schedules')
    .loginVia(patient)
    .query({ specialty_id: specialtyOne.id, clinic_id: -1 })
    .send()
    .end()

  response.assertStatus(404)
})
