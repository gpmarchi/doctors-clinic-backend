'use strict'

const { ioc } = require('@adonisjs/fold')

const Role = ioc.use('Adonis/Acl/Role')
const Permission = ioc.use('Adonis/Acl/Permission')

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')

const { test, trait, beforeEach } = use('Test/Suite')('Role')

trait('Test/ApiClient')
trait('Auth/Client')

let loginUser = null

beforeEach(async () => {
  await User.truncate()
  await Role.truncate()
  await Permission.truncate()

  const sessionPayload = {
    email: 'user@email.com',
    password: '123456',
  }

  loginUser = await Factory.model('App/Models/User').create(sessionPayload)
})

test('it should create a new role', async ({ client, assert }) => {
  const data = await Factory.model('Adonis/Acl/Role').make()

  const role = data.$attributes

  const response = await client
    .post('/roles')
    .loginVia(loginUser)
    .send(role)
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(response.body.slug, role.slug)
})

test('it should create a new role with permissions', async ({
  client,
  assert,
}) => {
  const roleData = await Factory.model('Adonis/Acl/Role').make()
  const permissionData = await Factory.model(
    'Adonis/Acl/Permission'
  ).createMany(2)

  const role = roleData.$attributes
  const permissions = permissionData.map((permission) => permission.$attributes)

  const response = await client
    .post('/roles')
    .loginVia(loginUser)
    .send({ ...role, permissions: [permissions[0].id, permissions[1].id] })
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(response.body.slug, role.slug)
  assert.equal(2, response.body.permissions.length)
  assert.include(response.body.permissions[0], permissions[0])
  assert.include(response.body.permissions[1], permissions[1])
})

test('it should update an existent role', async ({ client, assert }) => {
  const data = await Factory.model('Adonis/Acl/Role').create()

  const role = data.$attributes

  role.name = 'updated name'

  const response = await client
    .patch(`/roles/${role.id}`)
    .loginVia(loginUser)
    .send(role)
    .end()

  response.assertStatus(200)
  assert.equal(response.body.id, role.id)
  assert.equal(response.body.name, role.name)
})

test('it should update an existent role with permissions', async ({
  client,
  assert,
}) => {
  const roleData = await Factory.model('Adonis/Acl/Role').create()
  const permissionData = await Factory.model(
    'Adonis/Acl/Permission'
  ).createMany(2)

  const role = roleData.$attributes
  role.name = 'updated name'

  const permissions = permissionData.map((permission) => permission.$attributes)

  const response = await client
    .patch(`/roles/${role.id}`)
    .loginVia(loginUser)
    .send({ ...role, permissions: [permissions[0].id, permissions[1].id] })
    .end()

  response.assertStatus(200)
  assert.equal(response.body.id, role.id)
  assert.equal(response.body.name, role.name)
  assert.equal(2, response.body.permissions.length)
  assert.include(response.body.permissions[0], permissions[0])
  assert.include(response.body.permissions[1], permissions[1])
})

test('it should not update non existent role', async ({ client }) => {
  const response = await client
    .patch('/roles/-1')
    .loginVia(loginUser)
    .send({ name: 'name' })
    .end()

  response.assertStatus(404)
})

test('it should delete an existent role', async ({ client, assert }) => {
  const data = await Factory.model('Adonis/Acl/Role').create()

  const role = data.$attributes

  const response = await client
    .delete(`/roles/${role.id}`)
    .loginVia(loginUser)
    .send()
    .end()

  const deletedRole = Role.find(role.id)

  response.assertStatus(204)
  assert.isEmpty(deletedRole)
})

test('it should not delete non existent role', async ({ client }) => {
  const response = await client
    .delete('/roles/-1')
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(404)
})

test('it should list all roles', async ({ client, assert }) => {
  await Factory.model('Adonis/Acl/Role').createMany(5)

  const response = await client.get('/roles').loginVia(loginUser).send().end()

  response.assertStatus(200)
  assert.equal(5, response.body.length)
})

test('it should list all roles with permissions', async ({
  client,
  assert,
}) => {
  const permissionData = await Factory.model('Adonis/Acl/Permission').create()
  const permission = permissionData.$attributes

  const role = await Factory.model('Adonis/Acl/Role').create()
  await role.permissions().attach([permission.id])

  const response = await client.get('/roles').loginVia(loginUser).send().end()

  response.assertStatus(200)
  assert.equal(1, response.body.length)
  assert.equal(1, response.body[0].permissions.length)
  assert.include(response.body[0].permissions[0], permission)
})

test('it should show a role by id', async ({ client, assert }) => {
  const data = await Factory.model('Adonis/Acl/Role').create()

  const role = data.$attributes

  const response = await client
    .get(`/roles/${role.id}`)
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(role.name, response.body.name)
})

test('it should show a role by id with permissions', async ({
  client,
  assert,
}) => {
  const permissionData = await Factory.model('Adonis/Acl/Permission').create()
  const permission = permissionData.$attributes

  const data = await Factory.model('Adonis/Acl/Role').create()
  await data.permissions().attach([permission.id])

  const role = data.$attributes

  const response = await client
    .get(`/roles/${role.id}`)
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(role.name, response.body.name)
  assert.equal(1, response.body.permissions.length)
  assert.include(response.body.permissions[0], permission)
})

test('it should not show non existent role', async ({ client }) => {
  const response = await client
    .get('/roles/-1')
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(404)
})
