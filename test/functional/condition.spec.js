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
const Condition = use('App/Models/Condition')

const { test, trait, before, beforeEach } = use('Test/Suite')('Condition')

trait('Test/ApiClient')
trait('Auth/Client')

let loginUser = null

before(async () => {
  await User.query().delete()
  await Role.query().delete()
  await Condition.query().delete()
  await Database.truncate('role_user')

  loginUser = await Factory.model('App/Models/User').create()

  const adminRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'administrator',
  })
  await loginUser.roles().attach([adminRole.toJSON().id])
})

beforeEach(async () => {
  await Condition.query().delete()
})

test('it should create a new condition', async ({ client, assert }) => {
  const conditionData = await Factory.model('App/Models/Condition').make()
  const condition = conditionData.toJSON()

  const response = await client
    .post('/conditions')
    .loginVia(loginUser)
    .send(condition)
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(response.body.name, condition.name)
})

test('it should create a new condition with specialty', async ({
  client,
  assert,
}) => {
  const conditionData = await Factory.model('App/Models/Condition').make()
  const condition = conditionData.toJSON()

  const specialtyData = await Factory.model('App/Models/Specialty').create()
  const specialty = specialtyData.toJSON()

  const response = await client
    .post('/conditions')
    .loginVia(loginUser)
    .send({ ...condition, specialty_id: specialty.id })
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.exists(response.body.name)
  assert.equal(response.body.description, condition.description)
  assert.exists(response.body.specialty)
})

test('it should update an existent condition', async ({ client, assert }) => {
  const conditionData = await Factory.model('App/Models/Condition').create()
  const condition = conditionData.toJSON()

  condition.name = 'updated description'

  const response = await client
    .patch(`/conditions/${condition.id}`)
    .loginVia(loginUser)
    .send(condition)
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(response.body.name, condition.name)
})

test("it should update an existent condition's specialty", async ({
  client,
  assert,
}) => {
  const condition = await Factory.model('App/Models/Condition').create()

  const specialty = await Factory.model('App/Models/Specialty').create()

  const response = await client
    .patch(`/conditions/${condition.id}`)
    .loginVia(loginUser)
    .send({ specialty_id: specialty.id })
    .end()

  response.assertStatus(200)
  assert.exists(response.body.specialty)
})

test('it should not update non existent condition', async ({
  client,
  assert,
}) => {
  const response = await client
    .patch('/conditions/-1')
    .loginVia(loginUser)
    .send({ name: 'name' })
    .end()

  response.assertStatus(404)
})

test('it should delete an existent condition', async ({ client, assert }) => {
  const condition = await Factory.model('App/Models/Condition').create()

  const response = await client
    .delete(`/conditions/${condition.id}`)
    .loginVia(loginUser)
    .send()
    .end()

  const deletedCondition = Condition.find(condition.id)

  response.assertStatus(204)
  assert.isEmpty(deletedCondition)
})

test('it should not delete non existent condition', async ({ client }) => {
  const response = await client
    .delete('/conditions/-1')
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(404)
})

test('it should list all conditions', async ({ client, assert }) => {
  await Factory.model('App/Models/Condition').createMany(5)

  const response = await client
    .get('/conditions')
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(5, response.body.data.length)
})

test('it should show a condition by id', async ({ client, assert }) => {
  const condition = await Factory.model('App/Models/Condition').create()

  const response = await client
    .get(`/conditions/${condition.id}`)
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.name, condition.name)
})

test('it should not show non existent condition', async ({ client }) => {
  const response = await client
    .get('/conditions/-1')
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(404)
})
