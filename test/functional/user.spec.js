'use strict'

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')

const { test, trait, beforeEach } = use('Test/Suite')('User')

trait('Test/ApiClient')
trait('Auth/Client')

let loginUser = null

beforeEach(async () => {
  await User.truncate()

  const sessionPayload = {
    email: 'user@email.com',
    password: '123456',
  }

  loginUser = await Factory.model('App/Models/User').create(sessionPayload)
})

test('it should create a new user', async ({ client, assert }) => {
  const data = await Factory.model('App/Models/User').make()

  const user = data.$attributes

  const response = await client.post('/users').send(user).end()

  response.assertStatus(200)
  assert.exists(response.body.username)
  assert.equal(response.body.username, user.username)
})

test('it should update an existing user', async ({ client, assert }) => {
  const data = await Factory.model('App/Models/User').create()

  const user = data.$attributes

  const response = await client
    .patch(`/users/${user.id}`)
    .loginVia(loginUser)
    .send({ username: 'username' })
    .end()

  response.assertStatus(200)
  assert.exists(response.body.username)
  assert.equal(response.body.username, 'username')
})

test('it should not update non existing user', async ({ client, assert }) => {
  const response = await client
    .patch('/users/-1')
    .loginVia(loginUser)
    .send({ username: 'username' })
    .end()

  response.assertStatus(404)
})

test('it should delete an existing user', async ({ client, assert }) => {
  const data = await Factory.model('App/Models/User').create()

  const user = data.$attributes

  const response = await client
    .delete(`/users/${user.id}`)
    .loginVia(loginUser)
    .send()
    .end()

  const deletedUser = User.find(user.id)

  response.assertStatus(204)
  assert.isEmpty(deletedUser)
})

test('it should not delete non existing user', async ({ client }) => {
  const response = await client
    .delete('/users/-1')
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(404)
})

test('it should list all users', async ({ client, assert }) => {
  await Factory.model('App/Models/User').createMany(5)

  const response = await client.get('/users').loginVia(loginUser).send().end()

  response.assertStatus(200)
  assert.equal(6, response.body.length)
})

test('it should list a user by id', async ({ client, assert }) => {
  const data = await Factory.model('App/Models/User').create()

  const user = data.$attributes

  const response = await client
    .get(`/users/${user.id}`)
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(user.username, response.body.username)
})

test('it should not show non existant user', async ({ client, assert }) => {
  const response = await client
    .get('/users/-1')
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(404)
})
