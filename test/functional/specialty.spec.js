'use strict'

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Specialty = use('App/Models/Specialty')

const { test, trait, beforeEach } = use('Test/Suite')('Specialty')

trait('Test/ApiClient')
trait('Auth/Client')

let loginUser = null

beforeEach(async () => {
  await User.truncate()
  await Specialty.truncate()

  const sessionPayload = {
    email: 'user@email.com',
    password: '123456',
  }

  loginUser = await Factory.model('App/Models/User').create(sessionPayload)
})

test('it should create a new specialty', async ({ client, assert }) => {
  const data = await Factory.model('App/Models/Specialty').make()

  const specialty = data.$attributes

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

  const specialty = data.$attributes

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

  const specialty = data.$attributes

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
  assert.equal(5, response.body.length)
})

test('it should show a specialty by id', async ({ client, assert }) => {
  const data = await Factory.model('App/Models/Specialty').create()

  const specialty = data.$attributes

  const response = await client
    .get(`/specialties/${specialty.id}`)
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(specialty.name, response.body.name)
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
