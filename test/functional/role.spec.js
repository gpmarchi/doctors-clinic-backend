'use strict'

const { ioc } = require('@adonisjs/fold')

const Role = ioc.use('Adonis/Acl/Role')
const Permission = ioc.use('Adonis/Acl/Permission')

/** @type {import('@adonisjs/lucid/src/Database')} */
const Database = use('Database')
/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')

const { test, trait, before, beforeEach } = use('Test/Suite')('Role')

trait('Test/ApiClient')
trait('Auth/Client')

let loginUser = null

before(async () => {
  await User.truncate()
  await Role.truncate()
  await Database.truncate('role_user')

  loginUser = await Factory.model('App/Models/User').create()

  const adminRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'administrator',
  })
  await loginUser.roles().attach([adminRole.toJSON().id])
})

beforeEach(async () => {
  await Role.query().where('id', '>', '1').delete()
  await Permission.truncate()
})

test('it should create a new role', async ({ client, assert }) => {
  const data = await Factory.model('Adonis/Acl/Role').make()

  const role = data.toJSON()

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

  const role = roleData.toJSON()
  const permissions = permissionData.map((permission) => permission.toJSON())

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

  const role = data.toJSON()

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

  const role = roleData.toJSON()
  role.name = 'updated name'

  const permissions = permissionData.map((permission) => permission.toJSON())

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

  const role = data.toJSON()

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
  assert.equal(6, response.body.data.length)
})

test('it should list all roles with permissions', async ({
  client,
  assert,
}) => {
  const permissionData = await Factory.model('Adonis/Acl/Permission').create()
  const permission = permissionData.toJSON()

  const role = await Factory.model('Adonis/Acl/Role').create()
  await role.permissions().attach([permission.id])

  const response = await client.get('/roles').loginVia(loginUser).send().end()

  response.assertStatus(200)
  assert.equal(2, response.body.data.length)
  assert.equal(1, response.body.data[1].permissions.length)
  assert.include(response.body.data[1].permissions[0], permission)
})

test('it should show a role by id', async ({ client, assert }) => {
  const data = await Factory.model('Adonis/Acl/Role').create()

  const role = data.toJSON()

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
  const permission = permissionData.toJSON()

  const data = await Factory.model('Adonis/Acl/Role').create()
  await data.permissions().attach([permission.id])

  const role = data.toJSON()

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
