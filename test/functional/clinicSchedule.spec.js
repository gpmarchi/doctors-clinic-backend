'use strict'

const { ioc } = require('@adonisjs/fold')

const Role = ioc.use('Adonis/Acl/Role')

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Specialty = use('App/Models/Specialty')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Clinic = use('App/Models/Clinic')

const { test, trait, before, after } = use('Test/Suite')('Clinic Schedule')

trait('Test/ApiClient')
trait('Auth/Client')

let pacient = null
let doctor = null
let specialty = null
let clinic = null

before(async () => {
  await User.truncate()
  await Role.truncate()
  await Specialty.truncate()
  await Clinic.truncate()

  const pacientRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'pacient',
  })
  const doctorRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'doctor',
  })

  specialty = await Factory.model('App/Models/Specialty').create()
  const specialtyCheck = await Factory.model('App/Models/Specialty').create()

  pacient = await Factory.model('App/Models/User').create()
  await pacient.roles().attach([pacientRole.$attributes.id])

  doctor = await Factory.model('App/Models/User').create({
    specialty_id: specialty.id,
  })
  await doctor.roles().attach([doctorRole.$attributes.id])

  const doctorCheck = await Factory.model('App/Models/User').create({
    specialty_id: specialtyCheck.id,
  })
  await doctor.roles().attach([doctorRole.$attributes.id])

  clinic = await Factory.model('App/Models/Clinic').create()
  await clinic.specialties().attach([specialty.id, specialtyCheck.id])

  await Factory.model('App/Models/Timetable').createMany(2, {
    clinic_id: clinic.id,
    doctor_id: doctor.id,
  })

  await Factory.model('App/Models/Timetable').createMany(3, {
    clinic_id: clinic.id,
    doctor_id: doctorCheck.id,
  })
})

after(async () => {
  await pacient.roles().delete()
  await doctor.roles().delete()
})

test('it should return the clinic with a list of doctors by specialty with available timetables', async ({
  client,
  assert,
}) => {
  const response = await client
    .get('/schedules')
    .loginVia(pacient)
    .query({ specialty_id: specialty.id, clinic_id: clinic.id })
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body[0].timetables.length, 2)
})

test('it should not return the clinic with available timetables if specialty not provided', async ({
  client,
  assert,
}) => {
  const response = await client
    .get('/schedules')
    .loginVia(pacient)
    .query({ clinic_id: clinic.id })
    .send()
    .end()

  response.assertStatus(400)
})

test('it should not return the clinic with available timetables if clinic not provided', async ({
  client,
  assert,
}) => {
  const response = await client
    .get('/schedules')
    .loginVia(pacient)
    .query({ specialty_id: specialty.id })
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
    .loginVia(pacient)
    .query({ specialty_id: specialty.id, clinic_id: -1 })
    .send()
    .end()

  response.assertStatus(404)
})
