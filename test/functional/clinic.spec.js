'use strict'

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

const { ioc } = require('@adonisjs/fold')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Address = use('App/Models/Address')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Clinic = use('App/Models/Clinic')

const Role = ioc.use('Adonis/Acl/Role')
ioc.use('Adonis/Acl/HasRole')

const { test, trait, beforeEach, after } = use('Test/Suite')('Clinic')

trait('Test/ApiClient')
trait('Auth/Client')

let loginUser = null
let loginAdminOne = null
let loginAdminTwo = null

beforeEach(async () => {
  await User.truncate()
  await Address.truncate()
  await Clinic.truncate()
  await Role.truncate()

  const userSessionPayload = {
    email: 'user@email.com',
    password: '123456',
  }

  const adminOneSessionPayload = {
    email: 'admin1@email.com',
    password: '123456',
  }

  const adminTwoSessionPayload = {
    email: 'admin2@email.com',
    password: '123456',
  }

  const adminRolePayload = {
    slug: 'administrator',
  }

  loginUser = await Factory.model('App/Models/User').create(userSessionPayload)

  const adminRole = await Factory.model('Adonis/Acl/Role').create(
    adminRolePayload
  )

  loginAdminOne = await Factory.model('App/Models/User').create(
    adminOneSessionPayload
  )

  loginAdminTwo = await Factory.model('App/Models/User').create(
    adminTwoSessionPayload
  )

  await loginAdminOne.roles().attach([adminRole.$attributes.id])
  await loginAdminTwo.roles().attach([adminRole.$attributes.id])
})

after(async () => {
  await loginUser.roles().delete()
  await loginAdminOne.roles().delete()
})

test('it should create a new clinic', async ({ client, assert }) => {
  const clinicData = await Factory.model('App/Models/Clinic').make()
  const clinic = clinicData.$attributes

  const response = await client
    .post('/clinics')
    .loginVia(loginAdminOne)
    .send(clinic)
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(response.body.cnpj, clinic.cnpj)
  assert.equal(response.body.owner.id, loginAdminOne.id)
})

test('it should create a new clinic with address', async ({
  client,
  assert,
}) => {
  const clinicData = await Factory.model('App/Models/Clinic').make()
  const addressData = await Factory.model('App/Models/Address').make()

  const clinic = clinicData.$attributes
  const address = { ...addressData.$attributes }

  const response = await client
    .post('/clinics')
    .loginVia(loginAdminOne)
    .send({ ...clinic, address })
    .end()

  response.assertStatus(200)
  assert.exists(response.body.cnpj)
  assert.equal(response.body.cnpj, clinic.cnpj)
  assert.include(response.body.address, address)
})

test('it should not create a new clinic with invalid address', async ({
  client,
  assert,
}) => {
  const clinicData = await Factory.model('App/Models/Clinic').make()
  const addressData = await Factory.model('App/Models/Address').make()

  const clinic = clinicData.$attributes
  const address = { ...addressData.$attributes }
  delete address.street

  const response = await client
    .post('/clinics')
    .loginVia(loginAdminOne)
    .send({ ...clinic, address })
    .end()

  response.assertStatus(400)
})

test("it should create an existing clinic's address", async ({
  client,
  assert,
}) => {
  const clinicData = await Factory.model('App/Models/Clinic').create({
    owner_id: loginAdminOne.id,
  })

  const addressData = await Factory.model('App/Models/Address').make()
  const address = { ...addressData.$attributes }

  const response = await client
    .patch(`/clinics/${clinicData.id}`)
    .loginVia(loginAdminOne)
    .send({ address })
    .end()

  response.assertStatus(200)
  assert.include(response.body.address, address)
})

test('it should update an existing clinic', async ({ client, assert }) => {
  const clinicData = await Factory.model('App/Models/Clinic').create({
    owner_id: loginAdminOne.id,
  })

  const clinic = clinicData.$attributes

  const response = await client
    .patch(`/clinics/${clinic.id}`)
    .loginVia(loginAdminOne)
    .send({ name: 'name' })
    .end()

  response.assertStatus(200)
  assert.exists(response.body.name)
  assert.equal(response.body.name, 'name')
})

test("it should update an existing clinic's address", async ({
  client,
  assert,
}) => {
  const clinicData = await Factory.model('App/Models/Clinic').create({
    owner_id: loginAdminOne.id,
  })
  const clinic = clinicData.$attributes

  const addressData = await Factory.model('App/Models/Address').create({
    clinic_id: clinic.id,
  })
  const address = { ...addressData.$attributes }

  address.street = 'updated street'

  const response = await client
    .patch(`/clinics/${clinic.id}`)
    .loginVia(loginAdminOne)
    .send({ address })
    .end()

  response.assertStatus(200)
  assert.equal(response.body.address.street, address.street)
  assert.equal(response.body.address.district, address.district)
})

test('it should not update non existing clinic', async ({ client, assert }) => {
  const response = await client
    .patch('/clinics/-1')
    .loginVia(loginAdminOne)
    .send({ name: 'name' })
    .end()

  response.assertStatus(404)
})

test('it should not update clinic if not owner', async ({ client, assert }) => {
  const clinicData = await Factory.model('App/Models/Clinic').create({
    owner_id: loginAdminOne.id,
  })

  const clinic = clinicData.$attributes

  const response = await client
    .patch(`/clinics/${clinic.id}`)
    .loginVia(loginAdminTwo)
    .send({ name: 'name' })
    .end()

  response.assertStatus(403)
})

test("it should not update an existing clinic's address with bad data", async ({
  client,
  assert,
}) => {
  const clinicData = await Factory.model('App/Models/Clinic').create({
    owner_id: loginAdminOne.id,
  })

  const addressData = await Factory.model('App/Models/Address').make()
  const address = { ...addressData.$attributes }
  delete address.street

  const response = await client
    .patch(`/clinics/${clinicData.id}`)
    .loginVia(loginAdminOne)
    .send({ address })
    .end()

  response.assertStatus(400)
})

test('it should delete an existing clinic', async ({ client, assert }) => {
  const clinicData = await Factory.model('App/Models/Clinic').create({
    owner_id: loginAdminOne.id,
  })

  const clinic = clinicData.$attributes

  const response = await client
    .delete(`/clinics/${clinic.id}`)
    .loginVia(loginAdminOne)
    .send()
    .end()

  const deleteClinic = Clinic.find(clinic.id)

  response.assertStatus(204)
  assert.isEmpty(deleteClinic)
})

test('it should not delete an existing clinic if not owner', async ({
  client,
  assert,
}) => {
  const clinicData = await Factory.model('App/Models/Clinic').create({
    owner_id: loginAdminOne.id,
  })

  const clinic = clinicData.$attributes

  const response = await client
    .delete(`/clinics/${clinic.id}`)
    .loginVia(loginAdminTwo)
    .send()
    .end()

  const notDeletedClinic = await Clinic.find(clinic.id)

  response.assertStatus(403)
  assert.equal(notDeletedClinic.id, clinic.id)
})

test('it should not delete non existing clinic', async ({ client }) => {
  const response = await client
    .delete('/clinics/-1')
    .loginVia(loginAdminOne)
    .send()
    .end()

  response.assertStatus(404)
})

test('it should list all clinics', async ({ client, assert }) => {
  await Factory.model('App/Models/Clinic').createMany(5, {
    owner_id: loginAdminOne.id,
  })

  const response = await client
    .get('/clinics')
    .loginVia(loginAdminOne)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(5, response.body.length)
})

test('it should not list clinics from another user', async ({
  client,
  assert,
}) => {
  await Factory.model('App/Models/Clinic').createMany(5, {
    owner_id: loginAdminOne.id,
  })

  const response = await client
    .get('/clinics')
    .loginVia(loginAdminTwo)
    .send()
    .end()

  response.assertStatus(200)
  assert.isEmpty(response.body)
})

test('it should list a clinic by id', async ({ client, assert }) => {
  const clinicData = await Factory.model('App/Models/Clinic').create({
    owner_id: loginAdminOne.id,
  })

  const clinic = clinicData.$attributes

  const response = await client
    .get(`/clinics/${clinic.id}`)
    .loginVia(loginAdminOne)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(clinic.name, response.body.name)
})

test("it should not list another user's clinic", async ({ client, assert }) => {
  const clinicData = await Factory.model('App/Models/Clinic').create({
    owner_id: loginAdminOne.id,
  })

  const clinic = clinicData.$attributes

  const response = await client
    .get(`/clinics/${clinic.id}`)
    .loginVia(loginAdminTwo)
    .send()
    .end()

  response.assertStatus(403)
})

test('it should not show non existent clinic', async ({ client }) => {
  const response = await client
    .get('/clinics/-1')
    .loginVia(loginAdminOne)
    .send()
    .end()

  response.assertStatus(404)
})
