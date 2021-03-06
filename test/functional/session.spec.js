'use strict'

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

const { test, trait } = use('Test/Suite')('Session')

trait('Test/ApiClient')

test('it should return JWT token when session created', async ({
  client,
  assert,
}) => {
  const sessionPayload = {
    email: 'test@email.com',
    password: '123456',
  }

  await Factory.model('App/Models/User').create(sessionPayload)

  const response = await client.post('/sessions').send(sessionPayload).end()

  response.assertStatus(200)
  assert.exists(response.body.token)
})
