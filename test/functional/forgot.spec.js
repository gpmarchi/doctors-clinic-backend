'use strict'

const dateFns = use('date-fns')
const crypto = use('crypto')

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')
/** @type {import('@adonisjs/framework/src/Hash')} */
const Hash = use('Hash')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')

const { test, trait, before } = use('Test/Suite')('Forgot Password')

trait('Test/ApiClient')
trait('Auth/Client')

let loginUser = null

before(async () => {
  await User.query().delete()

  loginUser = await Factory.model('App/Models/User').create()
})

test('it should return reset password token', async ({ client, assert }) => {
  const response = await client
    .post('/users/forgot')
    .send({
      email: loginUser.email,
    })
    .end()

  const user = await User.findBy('email', loginUser.email)

  response.assertStatus(204)
  assert.equal(user.id, loginUser.id)
  assert.equal(user.email, loginUser.email)
  assert.exists(user.token)
  assert.exists(user.token_created_at)
})

test('it should not return reset password token if user does not exists', async ({
  client,
}) => {
  const response = await client
    .post('/users/forgot')
    .send({ email: 'someemail@email.com' })
    .end()

  response.assertStatus(404)
})

test('it should reset password based on token', async ({ client, assert }) => {
  loginUser.token = crypto.randomBytes(10).toString('hex')
  loginUser.token_created_at = new Date()
  await loginUser.save()

  const password = 'sadfjh#$'

  const response = await client
    .patch('/users/forgot')
    .send({ token: loginUser.token, password })
    .end()

  const user = await User.findBy('email', loginUser.email)

  response.assertStatus(204)
  assert.equal(user.id, loginUser.id)
  assert.isTrue(await Hash.verify(password, user.password))
  assert.notExists(user.token)
  assert.notExists(user.token_created_at)
})

test('it should not reset password based on inexistent token', async ({
  client,
}) => {
  const response = await client
    .patch('/users/forgot')
    .send({ token: 'wlskdjfwoieurioiou', password: 'sadfjh#$' })
    .end()

  response.assertStatus(404)
})

test('it should not reset password based on expired token', async ({
  client,
  assert,
}) => {
  loginUser.token = crypto.randomBytes(10).toString('hex')
  loginUser.token_created_at = dateFns.sub(new Date(), { days: 3 })
  await loginUser.save()

  const response = await client
    .patch('/users/forgot')
    .send({ token: loginUser.token, password: 'sadfjh#$' })
    .end()

  response.assertStatus(401)
})
