'use strict'

const { ioc } = require('@adonisjs/fold')

const Role = ioc.use('Adonis/Acl/Role')

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Medicine = use('App/Models/Medicine')

const { test, trait, before, beforeEach, after } = use('Test/Suite')('Medicine')

trait('Test/ApiClient')
trait('Auth/Client')

let loginUser = null

before(async () => {
  await User.truncate()
  await Role.truncate()
  await Medicine.truncate()

  loginUser = await Factory.model('App/Models/User').create()

  const adminRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'administrator',
  })
  await loginUser.roles().attach([adminRole.$attributes.id])
})

beforeEach(async () => {
  await Medicine.truncate()
})

after(async () => {
  await loginUser.roles().delete()
})

test('it should create a new medicine', async ({ client, assert }) => {
  const medicineData = await Factory.model('App/Models/Medicine').make()
  const medicine = medicineData.$attributes

  const response = await client
    .post('/medicines')
    .loginVia(loginUser)
    .send(medicine)
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(response.body.name, medicine.name)
})

test('it should create a new medicine with leaflet', async ({
  client,
  assert,
}) => {
  const medicineData = await Factory.model('App/Models/Medicine').make()
  const medicine = medicineData.$attributes

  const fileData = await Factory.model('App/Models/File').create()
  const file = fileData.$attributes

  const response = await client
    .post('/medicines')
    .loginVia(loginUser)
    .send({ ...medicine, leaflet_id: file.id })
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.exists(response.body.name)
  assert.exists(response.body.leaflet)
  assert.equal(response.body.active_ingredient, medicine.active_ingredient)
})

test('it should update an existent medicine', async ({ client, assert }) => {
  const medicineData = await Factory.model('App/Models/Medicine').create()
  const medicine = medicineData.$attributes

  medicine.name = 'updated description'

  const response = await client
    .patch(`/medicines/${medicine.id}`)
    .loginVia(loginUser)
    .send(medicine)
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(response.body.name, medicine.name)
})

test("it should update an existent medicine's leaflet", async ({
  client,
  assert,
}) => {
  const medicine = await Factory.model('App/Models/Medicine').create()

  const file = await Factory.model('App/Models/File').create()

  const response = await client
    .patch(`/medicines/${medicine.id}`)
    .loginVia(loginUser)
    .send({ leaflet_id: file.id })
    .end()

  response.assertStatus(200)
  assert.exists(response.body.leaflet)
})

test('it should not update non existent medicine', async ({
  client,
  assert,
}) => {
  const response = await client
    .patch('/medicines/-1')
    .loginVia(loginUser)
    .send({ name: 'name' })
    .end()

  response.assertStatus(404)
})

test('it should delete an existent medicine', async ({ client, assert }) => {
  const medicine = await Factory.model('App/Models/Medicine').create()

  const response = await client
    .delete(`/medicines/${medicine.id}`)
    .loginVia(loginUser)
    .send()
    .end()

  const deletedMedicine = Medicine.find(medicine.id)

  response.assertStatus(204)
  assert.isEmpty(deletedMedicine)
})

test('it should not delete non existent medicne', async ({ client }) => {
  const response = await client
    .delete('/medicines/-1')
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(404)
})

test('it should list all medicines', async ({ client, assert }) => {
  await Factory.model('App/Models/Medicine').createMany(5)

  const response = await client
    .get('/medicines')
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(5, response.body.data.length)
})

test('it should show a medicine by id', async ({ client, assert }) => {
  const medicine = await Factory.model('App/Models/Medicine').create()

  const response = await client
    .get(`/medicines/${medicine.id}`)
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.name, medicine.name)
})

test('it should not show non existent medicine', async ({ client }) => {
  const response = await client
    .get('/medicines/-1')
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(404)
})
