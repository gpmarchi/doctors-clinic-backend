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

const { test, trait, before, beforeEach } = use('Test/Suite')('Specialty')

trait('Test/ApiClient')
trait('Auth/Client')

let loginUser = null

before(async () => {
  await User.query().delete()
  await Role.query().delete()
  await Database.truncate('role_user')

  loginUser = await Factory.model('App/Models/User').create()

  const adminRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'administrator',
  })
  await loginUser.roles().attach([adminRole.toJSON().id])
})

beforeEach(async () => {
  await Specialty.query().delete()
  await Clinic.query().delete()
})

test('it should create a new specialty', async ({ client, assert }) => {
  const data = await Factory.model('App/Models/Specialty').make()

  const specialty = data.toJSON()

  const response = await client
    .post('/specialties')
    .loginVia(loginUser)
    .send(specialty)
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(response.body.name, specialty.name)
})

test('it should update an existent specialty', async ({ client, assert }) => {
  const data = await Factory.model('App/Models/Specialty').create()

  const specialty = data.toJSON()

  specialty.description = 'updated description'

  const response = await client
    .patch(`/specialties/${specialty.id}`)
    .loginVia(loginUser)
    .send(specialty)
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(response.body.description, specialty.description)
})

test('it should not update non existent specialty', async ({
  client,
  assert,
}) => {
  const response = await client
    .patch('/specialties/-1')
    .loginVia(loginUser)
    .send({ name: 'name' })
    .end()

  response.assertStatus(404)
})

test('it should delete an existent specialty', async ({ client, assert }) => {
  const data = await Factory.model('App/Models/Specialty').create()

  const specialty = data.toJSON()

  const response = await client
    .delete(`/specialties/${specialty.id}`)
    .loginVia(loginUser)
    .send()
    .end()

  const deletedSpecialty = Specialty.find(specialty.id)

  response.assertStatus(204)
  assert.isEmpty(deletedSpecialty)
})

test('it should not delete non existent specialty', async ({
  client,
  assert,
}) => {
  const response = await client
    .delete('/specialties/-1')
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(404)
})

test('it should list all specialties', async ({ client, assert }) => {
  await Factory.model('App/Models/Specialty').createMany(5)

  const response = await client
    .get('/specialties')
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(5, response.body.data.length)
})

test('it should show a specialty by id', async ({ client, assert }) => {
  const data = await Factory.model('App/Models/Specialty').create()

  const specialty = data.toJSON()

  const response = await client
    .get(`/specialties/${specialty.id}`)
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(specialty.name, response.body.name)
})

test('it should list a specialty by id with clinics', async ({
  client,
  assert,
}) => {
  const specialtyData = await Factory.model('App/Models/Specialty').create()
  const specialty = specialtyData.toJSON()

  const clinics = await Factory.model('App/Models/Clinic').createMany(5, {
    owner_id: loginUser.id,
  })

  const associations = clinics.map(
    async (clinic) => await clinic.specialties().attach([specialty.id])
  )

  await Promise.all(associations)

  const response = await client
    .get(`/specialties/${specialty.id}`)
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.name, specialty.name)
  assert.equal(response.body.clinics.length, 5)
})

test('it should not show non existent specialty', async ({
  client,
  assert,
}) => {
  const response = await client
    .get('/specialties/-1')
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(404)
})
