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
const Timetable = use('App/Models/Timetable')

const { test, trait, before, beforeEach } = use('Test/Suite')('Timetable')

trait('Test/ApiClient')
trait('Auth/Client')

let loginDoctorOne = null
let loginDoctorTwo = null
let loginAdmin = null
let clinicData = null

before(async () => {
  await User.truncate()
  await Role.truncate()
  await Clinic.truncate()
  await Timetable.truncate()
  await Database.truncate('role_user')

  const doctorRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'doctor',
  })

  const adminRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'administrator',
  })

  loginDoctorOne = await Factory.model('App/Models/User').create()
  await loginDoctorOne.roles().attach([doctorRole.toJSON().id])

  loginDoctorTwo = await Factory.model('App/Models/User').create()
  await loginDoctorTwo.roles().attach([doctorRole.toJSON().id])

  loginAdmin = await Factory.model('App/Models/User').create()
  await loginAdmin.roles().attach([adminRole.toJSON().id])

  clinicData = await Factory.model('App/Models/Clinic').create()
})

beforeEach(async () => {
  await Timetable.truncate()
})

test('it should create a new timetable', async ({ client, assert }) => {
  const timetableData = await Factory.model('App/Models/Timetable').make({
    clinic_id: clinicData.id,
  })
  const timetable = timetableData.toJSON()

  const response = await client
    .post('/timetables')
    .loginVia(loginDoctorOne)
    .send(timetable)
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(response.body.datetime, timetable.datetime)
  assert.equal(response.body.doctor_id, loginDoctorOne.id)
  assert.equal(response.body.clinic_id, timetable.clinic_id)
  assert.exists(response.body.doctor)
  assert.exists(response.body.clinic)
})

test('it should not create a new timetable if already registered', async ({
  client,
  assert,
}) => {
  const datetime = new Date()

  await Factory.model('App/Models/Timetable').create({
    datetime,
    doctor_id: loginDoctorOne.id,
    clinic_id: clinicData.id,
  })

  const timetableData = await Factory.model('App/Models/Timetable').make({
    datetime: datetime.getTime(),
    clinic_id: clinicData.id,
  })
  const timetable = timetableData.toJSON()

  const response = await client
    .post('/timetables')
    .loginVia(loginDoctorOne)
    .send(timetable)
    .end()

  response.assertStatus(400)
})

test("it shouldn't create a new timetable to another doctor if not admin", async ({
  client,
}) => {
  const timetableData = await Factory.model('App/Models/Timetable').make({
    clinic_id: clinicData.id,
    doctor_id: loginDoctorOne.id,
  })
  const timetable = timetableData.toJSON()

  const response = await client
    .post('/timetables')
    .loginVia(loginDoctorTwo)
    .send(timetable)
    .end()

  response.assertStatus(401)
})

test('it should provide doctor id to create a new timetable if admin', async ({
  client,
}) => {
  const timetableData = await Factory.model('App/Models/Timetable').make({
    clinic_id: clinicData.id,
  })
  const timetable = timetableData.toJSON()

  const response = await client
    .post('/timetables')
    .loginVia(loginAdmin)
    .send(timetable)
    .end()

  response.assertStatus(400)
})

test('it should create a new timetable for doctor if admin', async ({
  client,
  assert,
}) => {
  const timetableData = await Factory.model('App/Models/Timetable').make({
    doctor_id: loginDoctorTwo.id,
    clinic_id: clinicData.id,
  })
  const timetable = timetableData.toJSON()

  const response = await client
    .post('/timetables')
    .loginVia(loginAdmin)
    .send(timetable)
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(response.body.datetime, timetable.datetime)
  assert.equal(response.body.doctor_id, loginDoctorTwo.id)
  assert.equal(response.body.clinic_id, timetable.clinic_id)
  assert.exists(response.body.doctor)
  assert.exists(response.body.clinic)
})

test('it should update an existing timetable', async ({ client, assert }) => {
  const timetable = await Factory.model('App/Models/Timetable').create({
    doctor_id: loginDoctorTwo.id,
    clinic_id: clinicData.id,
  })

  const datetime = new Date()

  const response = await client
    .patch(`/timetables/${timetable.id}`)
    .loginVia(loginDoctorTwo)
    .send({ datetime })
    .end()

  response.assertStatus(200)
  assert.equal(new Date(response.body.datetime).getTime(), datetime.getTime())
  assert.equal(response.body.doctor.id, loginDoctorTwo.id)
})

test("it shouldn't update an inexistent timetable", async ({ client }) => {
  const response = await client
    .patch('/timetables/-1')
    .loginVia(loginDoctorTwo)
    .send()
    .end()

  response.assertStatus(404)
})

test("it shouldn't update another doctor's timetable", async ({ client }) => {
  const timetable = await Factory.model('App/Models/Timetable').create({
    doctor_id: loginDoctorOne.id,
    clinic_id: clinicData.id,
  })

  const datetime = new Date()

  const response = await client
    .patch(`/timetables/${timetable.id}`)
    .loginVia(loginDoctorTwo)
    .send({ datetime })
    .end()

  response.assertStatus(401)
})

test('it should update any existing timetable if admin', async ({
  client,
  assert,
}) => {
  const timetable = await Factory.model('App/Models/Timetable').create({
    doctor_id: loginDoctorTwo.id,
    clinic_id: clinicData.id,
  })

  const datetime = new Date()

  const response = await client
    .patch(`/timetables/${timetable.id}`)
    .loginVia(loginAdmin)
    .send({ doctor_id: loginDoctorOne.id, datetime })
    .end()

  response.assertStatus(200)
  assert.equal(new Date(response.body.datetime).getTime(), datetime.getTime())
  assert.equal(response.body.doctor.id, loginDoctorOne.id)
  assert.notEqual(response.body.doctor.id, loginAdmin.id)
})

test('it should delete an existing timetable', async ({ client, assert }) => {
  const timetableData = await Factory.model('App/Models/Timetable').create({
    doctor_id: loginDoctorTwo.id,
    clinic_id: clinicData.id,
  })

  const timetable = timetableData.toJSON()

  const response = await client
    .delete(`/timetables/${timetable.id}`)
    .loginVia(loginDoctorTwo)
    .send()
    .end()

  const deletedTimetable = Timetable.find(timetable.id)

  response.assertStatus(204)
  assert.isEmpty(deletedTimetable)
})

test("it shouldn't delete an inexistent timetable", async ({ client }) => {
  const response = await client
    .delete('/timetables/-1')
    .loginVia(loginDoctorTwo)
    .send()
    .end()

  response.assertStatus(404)
})

test("it shouldn't delete another doctor's timetable", async ({
  client,
  assert,
}) => {
  const timetable = await Factory.model('App/Models/Timetable').create({
    doctor_id: loginDoctorTwo.id,
    clinic_id: clinicData.id,
  })

  const response = await client
    .delete(`/timetables/${timetable.id}`)
    .loginVia(loginDoctorOne)
    .send()
    .end()

  response.assertStatus(401)
  assert.exists(await Timetable.find(timetable.id))
})

test('it should delete any existing timetable if admin', async ({
  client,
  assert,
}) => {
  const timetable = await Factory.model('App/Models/Timetable').create({
    doctor_id: loginDoctorTwo.id,
    clinic_id: clinicData.id,
  })

  const response = await client
    .delete(`/timetables/${timetable.id}`)
    .loginVia(loginAdmin)
    .send()
    .end()

  const deletedTimetable = Timetable.find(timetable.id)

  response.assertStatus(204)
  assert.isEmpty(deletedTimetable)
})

test("it should list all logged in doctor's timetables", async ({
  client,
  assert,
}) => {
  await Factory.model('App/Models/Timetable').createMany(5, {
    doctor_id: loginDoctorOne.id,
    clinic_id: clinicData.id,
  })

  await Factory.model('App/Models/Timetable').createMany(5, {
    doctor_id: loginDoctorTwo.id,
    clinic_id: clinicData.id,
  })

  const response = await client
    .get('/timetables')
    .loginVia(loginDoctorOne)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(5, response.body.data.length)
})

test("it should list all doctor's timetables if admin", async ({
  client,
  assert,
}) => {
  await Factory.model('App/Models/Timetable').createMany(5, {
    doctor_id: loginDoctorOne.id,
    clinic_id: clinicData.id,
  })

  await Factory.model('App/Models/Timetable').createMany(5, {
    doctor_id: loginDoctorTwo.id,
    clinic_id: clinicData.id,
  })

  const response = await client
    .get('/timetables')
    .loginVia(loginAdmin)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(10, response.body.data.length)
})

test('it should list a timetable by id from logged in user', async ({
  client,
  assert,
}) => {
  const timetable = await Factory.model('App/Models/Timetable').create({
    doctor_id: loginDoctorTwo.id,
    clinic_id: clinicData.id,
  })

  const response = await client
    .get(`/timetables/${timetable.id}`)
    .loginVia(loginDoctorTwo)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.id, timetable.id)
})

test('it should not list inexistent timetable', async ({ client, assert }) => {
  const response = await client
    .get('/timetables/-1')
    .loginVia(loginDoctorTwo)
    .send()
    .end()

  response.assertStatus(404)
})

test('it should not list a timetable from another doctor', async ({
  client,
  assert,
}) => {
  const timetable = await Factory.model('App/Models/Timetable').create({
    doctor_id: loginDoctorTwo.id,
    clinic_id: clinicData.id,
  })

  const response = await client
    .get(`/timetables/${timetable.id}`)
    .loginVia(loginDoctorOne)
    .send()
    .end()

  response.assertStatus(401)
})

test("it should list any doctor's timetable if admin", async ({
  client,
  assert,
}) => {
  const timetable = await Factory.model('App/Models/Timetable').create({
    doctor_id: loginDoctorTwo.id,
    clinic_id: clinicData.id,
  })

  const response = await client
    .get(`/timetables/${timetable.id}`)
    .loginVia(loginAdmin)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.id, timetable.id)
  assert.equal(response.body.doctor.id, loginDoctorTwo.id)
})
