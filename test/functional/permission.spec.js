'use strict'

const { ioc } = require('@adonisjs/fold')

const Role = ioc.use('Adonis/Acl/Role')
const Permission = ioc.use('Adonis/Acl/Permission')

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')

const { test, trait, beforeEach } = use('Test/Suite')('Permission')

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

  const adminRolePayload = {
    slug: 'administrator',
  }

  loginUser = await Factory.model('App/Models/User').create(sessionPayload)
  const adminRole = await Factory.model('Adonis/Acl/Role').create(
    adminRolePayload
  )
  await loginUser.roles().attach([adminRole.$attributes.id])
})

test('it should create a new permission', async ({ client, assert }) => {
  const data = await Factory.model('Adonis/Acl/Permission').make()

  const permission = data.$attributes

  const response = await client
    .post('/permissions')
    .loginVia(loginUser)
    .send(permission)
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(response.body.slug, permission.slug)
})

test('it should update an existent permission', async ({ client, assert }) => {
  const data = await Factory.model('Adonis/Acl/Permission').create()

  const permission = data.$attributes

  permission.name = 'updated name'

  const response = await client
    .patch(`/permissions/${permission.id}`)
    .loginVia(loginUser)
    .send(permission)
    .end()

  response.assertStatus(200)
  assert.equal(response.body.id, permission.id)
  assert.equal(response.body.name, permission.name)
})

test('it should not update non existent permission', async ({ client }) => {
  const response = await client
    .patch('/permissions/-1')
    .loginVia(loginUser)
    .send({ name: 'name' })
    .end()

  response.assertStatus(404)
})

test('it should delete an existent permission', async ({ client, assert }) => {
  const data = await Factory.model('Adonis/Acl/Permission').create()

  const permission = data.$attributes

  const response = await client
    .delete(`/permissions/${permission.id}`)
    .loginVia(loginUser)
    .send()
    .end()

  const deletedPermission = Permission.find(permission.id)

  response.assertStatus(204)
  assert.isEmpty(deletedPermission)
})

test('it should not delete non existent permission', async ({ client }) => {
  const response = await client
    .delete('/permissions/-1')
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(404)
})

test('it should list all permissions', async ({ client, assert }) => {
  await Factory.model('Adonis/Acl/Permission').createMany(5)

  const response = await client
    .get('/permissions')
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(5, response.body.length)
})

test('it should show a permission by id', async ({ client, assert }) => {
  const data = await Factory.model('Adonis/Acl/Permission').create()

  const permission = data.$attributes

  const response = await client
    .get(`/permissions/${permission.id}`)
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(permission.name, response.body.name)
})

test('it should not show non existent permission', async ({ client }) => {
  const response = await client
    .get('/permissions/-1')
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(404)
})
