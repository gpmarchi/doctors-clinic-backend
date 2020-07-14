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
const Surgery = use('App/Models/Surgery')

const { test, trait, before, beforeEach } = use('Test/Suite')('Surgery')

trait('Test/ApiClient')
trait('Auth/Client')

let administrator
let specialty

before(async () => {
  await User.query().delete()
  await Role.query().delete()
  await Specialty.query().delete()
  await Surgery.query().delete()
  await Database.truncate('role_user')

  administrator = await Factory.model('App/Models/User').create()

  const adminRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'administrator',
  })
  await administrator.roles().attach([adminRole.toJSON().id])

  specialty = await Factory.model('App/Models/Specialty').create()
})

beforeEach(async () => {
  await Surgery.query().delete()
})

test('it should create a new surgery', async ({ assert, client }) => {
  const surgery = await Factory.model('App/Models/Surgery').make({
    specialty_id: specialty.id,
  })
  const surgeryData = surgery.toJSON()

  const response = await client
    .post('/surgeries')
    .loginVia(administrator)
    .send(surgeryData)
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(response.body.name, surgeryData.name)
  assert.equal(response.body.description, surgeryData.description)
  assert.equal(response.body.specialty_id, surgeryData.specialty_id)
})

test('it should not create a new surgery if specialty does not exists', async ({
  assert,
  client,
}) => {
  const surgery = await Factory.model('App/Models/Surgery').make({
    specialty_id: -1,
  })
  const surgeryData = surgery.toJSON()

  const response = await client
    .post('/surgeries')
    .loginVia(administrator)
    .send(surgeryData)
    .end()

  response.assertStatus(404)
})

test('it should update an existent surgery', async ({ client, assert }) => {
  const surgery = await Factory.model('App/Models/Surgery').create({
    specialty_id: specialty.id,
  })
  const surgeryData = surgery.toJSON()

  surgeryData.name = 'updated name'

  const response = await client
    .patch(`/surgeries/${surgeryData.id}`)
    .loginVia(administrator)
    .send(surgeryData)
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(response.body.name, surgeryData.name)
  assert.equal(response.body.description, surgeryData.description)
  assert.equal(response.body.specialty_id, surgeryData.specialty_id)
})

test('it should not update an inexistent surgery', async ({
  client,
  assert,
}) => {
  const surgery = await Factory.model('App/Models/Surgery').create({
    specialty_id: specialty.id,
  })
  const surgeryData = surgery.toJSON()

  surgeryData.name = 'updated name'

  const response = await client
    .patch('/surgeries/-1')
    .loginVia(administrator)
    .send(surgeryData)
    .end()

  const originalSurgery = await Surgery.find(surgery.id)

  response.assertStatus(404)
  assert.equal(surgeryData.id, originalSurgery.id)
  assert.notEqual(originalSurgery.name, surgeryData.name)
  assert.equal(originalSurgery.description, surgeryData.description)
  assert.equal(originalSurgery.specialty_id, surgeryData.specialty_id)
})

test('it should not update an existent surgery with inexistent specialty', async ({
  client,
  assert,
}) => {
  const surgery = await Factory.model('App/Models/Surgery').create({
    specialty_id: specialty.id,
  })
  const surgeryData = surgery.toJSON()

  surgeryData.name = 'updated name'
  surgeryData.specialty_id = -1

  const response = await client
    .patch(`/surgeries/${surgeryData.id}`)
    .loginVia(administrator)
    .send(surgeryData)
    .end()

  const originalSurgery = await Surgery.find(surgery.id)

  response.assertStatus(404)
  assert.equal(surgeryData.id, originalSurgery.id)
  assert.notEqual(originalSurgery.name, surgeryData.name)
  assert.equal(originalSurgery.description, surgeryData.description)
  assert.notEqual(originalSurgery.specialty_id, surgeryData.specialty_id)
})

test('it should delete an existent surgery', async ({ client, assert }) => {
  const surgery = await Factory.model('App/Models/Surgery').create({
    specialty_id: specialty.id,
  })

  const response = await client
    .delete(`/surgeries/${surgery.id}`)
    .loginVia(administrator)
    .send()
    .end()

  const deletedSurgery = await Surgery.find(surgery.id)

  response.assertStatus(204)
  assert.isNull(deletedSurgery)
})

test('it should not delete an inexistent surgery', async ({ client }) => {
  const response = await client
    .delete('/surgeries/-1')
    .loginVia(administrator)
    .send()
    .end()

  response.assertStatus(404)
})

test('it should list all surgeries', async ({ client, assert }) => {
  await Factory.model('App/Models/Surgery').createMany(5, {
    specialty_id: specialty.id,
  })

  const response = await client
    .get('/surgeries')
    .loginVia(administrator)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(5, response.body.data.length)
})

test('it should show a surgery by id', async ({ client, assert }) => {
  const surgery = await Factory.model('App/Models/Surgery').create({
    specialty_id: specialty.id,
  })

  const surgeryData = surgery.toJSON()

  const response = await client
    .get(`/surgeries/${surgery.id}`)
    .loginVia(administrator)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.name, surgeryData.name)
  assert.equal(response.body.description, surgeryData.description)
  assert.equal(response.body.specialty_id, surgeryData.specialty_id)
})

test('it should not show non existent surgery', async ({ client }) => {
  const response = await client
    .get('/surgeries/-1')
    .loginVia(administrator)
    .send()
    .end()

  response.assertStatus(404)
})
