'use strict'

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

const { ioc } = require('@adonisjs/fold')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Address = use('App/Models/Address')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Specialty = use('App/Models/Specialty')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const File = use('App/Models/File')

const Role = ioc.use('Adonis/Acl/Role')
ioc.use('Adonis/Acl/HasRole')

const Permission = ioc.use('Adonis/Acl/Permission')
ioc.use('Adonis/Acl/HasPermission')

const { test, trait, before, beforeEach, after } = use('Test/Suite')('User')

trait('Test/ApiClient')
trait('Auth/Client')

let loginUser = null
let loginAdmin = null

before(async () => {
  await User.truncate()
  await Role.truncate()
  await File.truncate()

  loginUser = await Factory.model('App/Models/User').create()

  loginAdmin = await Factory.model('App/Models/User').create()
  const adminRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'administrator',
  })
  await loginAdmin.roles().attach([adminRole.$attributes.id])
})

beforeEach(async () => {
  await User.query().where('id', '>', '2').delete()
  await Address.truncate()
  await Specialty.truncate()
  await Role.query().where('id', '>', '1').delete()
  await Permission.truncate()
})

after(async () => {
  await loginUser.roles().delete()
  await loginAdmin.roles().delete()
})

test('it should create a new user', async ({ client, assert }) => {
  const data = await Factory.model('App/Models/User').make({
    password: 'slkj239ru!',
    password_confirmation: 'slkj239ru!',
  })

  const user = data.$attributes

  const response = await client.post('/users').send(user).end()

  response.assertStatus(200)
  assert.exists(response.body.username)
  assert.exists(response.body.fullname)
  assert.equal(response.body.username, user.username)
  assert.equal(response.body.fullname, `${user.first_name} ${user.last_name}`)
})

test('it should create a new user with avatar', async ({ client, assert }) => {
  const userData = await Factory.model('App/Models/User').make({
    password: 'slkj239ru!',
    password_confirmation: 'slkj239ru!',
  })
  const user = userData.$attributes

  const fileData = await Factory.model('App/Models/File').create()
  const file = fileData.$attributes

  const response = await client
    .post('/users')
    .send({ ...user, avatar_id: file.id })
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.exists(response.body.username)
  assert.exists(response.body.avatar)
  assert.equal(response.body.username, user.username)
})

test('it should create a new user with address', async ({ client, assert }) => {
  const userData = await Factory.model('App/Models/User').make({
    password: 'slkj239ru!',
    password_confirmation: 'slkj239ru!',
  })
  const addressData = await Factory.model('App/Models/Address').make()

  const user = userData.$attributes
  const address = { ...addressData.$attributes }

  const response = await client
    .post('/users')
    .send({ ...user, address })
    .end()

  response.assertStatus(200)
  assert.exists(response.body.username)
  assert.equal(response.body.username, user.username)
  assert.include(response.body.address, address)
})

test('it should not create a new user with invalid address', async ({
  client,
  assert,
}) => {
  const userData = await Factory.model('App/Models/User').make({
    password: 'slkj239ru!',
    password_confirmation: 'slkj239ru!',
  })
  const addressData = await Factory.model('App/Models/Address').make()

  const user = userData.$attributes
  const address = { ...addressData.$attributes }
  delete address.street

  const response = await client
    .post('/users')
    .send({ ...user, address })
    .end()

  response.assertStatus(400)
})

test('it should create a new user with specialty', async ({
  client,
  assert,
}) => {
  const userData = await Factory.model('App/Models/User').make({
    password: 'slkj239ru!',
    password_confirmation: 'slkj239ru!',
  })
  const specialtyData = await Factory.model('App/Models/Specialty').create()

  const user = userData.$attributes
  const specialty = { ...specialtyData.$attributes }

  const response = await client
    .post('/users')
    .send({ ...user, specialty_id: specialty.id })
    .end()

  response.assertStatus(200)
  assert.exists(response.body.username)
  assert.equal(response.body.username, user.username)
  assert.include(response.body.specialty, specialty)
})

test("it should create an existing user's address", async ({
  client,
  assert,
}) => {
  const addressData = await Factory.model('App/Models/Address').make()
  const address = { ...addressData.$attributes }

  const response = await client
    .patch(`/users/${loginUser.id}`)
    .loginVia(loginUser)
    .send({ address })
    .end()

  response.assertStatus(200)
  assert.include(response.body.address, address)
})

test('it should update an existing user', async ({ client, assert }) => {
  const response = await client
    .patch(`/users/${loginUser.id}`)
    .loginVia(loginUser)
    .send({ username: 'username' })
    .end()

  response.assertStatus(200)
  assert.exists(response.body.username)
  assert.equal(response.body.username, 'username')
})

test('it should update an existing user if admin', async ({
  client,
  assert,
}) => {
  const response = await client
    .patch(`/users/${loginUser.id}`)
    .loginVia(loginAdmin)
    .send({ username: 'username' })
    .end()

  response.assertStatus(200)
  assert.exists(response.body.username)
  assert.equal(response.body.username, 'username')
})

test('it should not update an existing user if not self or admin', async ({
  client,
  assert,
}) => {
  const user = await Factory.model('App/Models/User').create()

  const response = await client
    .patch(`/users/${user.id}`)
    .loginVia(loginUser)
    .send({ username: 'username' })
    .end()

  response.assertStatus(403)
})

test("it should update an existing user's address", async ({
  client,
  assert,
}) => {
  const addressData = await Factory.model('App/Models/Address').create({
    user_id: loginUser.id,
  })
  const address = { ...addressData.$attributes }

  address.street = 'updated street'

  const response = await client
    .patch(`/users/${loginUser.id}`)
    .loginVia(loginUser)
    .send({ address })
    .end()

  response.assertStatus(200)
  assert.equal(response.body.address.street, address.street)
  assert.equal(response.body.address.district, address.district)
})

test("it should update an existing user's specialty", async ({
  client,
  assert,
}) => {
  const specialtyData = await Factory.model('App/Models/Specialty').create()
  const specialty = { ...specialtyData.$attributes }
  delete specialty.created_at
  delete specialty.updated_at

  const response = await client
    .patch(`/users/${loginUser.id}`)
    .loginVia(loginUser)
    .send({ specialty_id: specialty.id })
    .end()

  response.assertStatus(200)
  assert.include(response.body.specialty, specialty)
})

test("it should update an existing user's roles", async ({
  client,
  assert,
}) => {
  const user = await Factory.model('App/Models/User').create()

  const roleData = await Factory.model('Adonis/Acl/Role').create()
  const role = { ...roleData.$attributes }

  const response = await client
    .patch(`/users/${user.id}`)
    .loginVia(loginAdmin)
    .send({ roles: [role.id] })
    .end()

  response.assertStatus(200)
  assert.include(response.body.roles[0], role)
})

test("it should not update an existing user's roles if logged in user is not an admin", async ({
  client,
  assert,
}) => {
  const user = await Factory.model('App/Models/User').create()

  const roleData = await Factory.model('Adonis/Acl/Role').create()
  const role = { ...roleData.$attributes }

  const response = await client
    .patch(`/users/${user.id}`)
    .loginVia(loginUser)
    .send({ roles: [role.id] })
    .end()

  response.assertStatus(403)
})

test("it should update an existing user's permissions", async ({
  client,
  assert,
}) => {
  const user = await Factory.model('App/Models/User').create()

  const permissionData = await Factory.model('Adonis/Acl/Permission').create()
  const permission = { ...permissionData.$attributes }

  const response = await client
    .patch(`/users/${user.id}`)
    .loginVia(loginAdmin)
    .send({ permissions: [permission.id] })
    .end()

  response.assertStatus(200)
  assert.include(response.body.permissions[0], permission)
})

test("it should not update an existing user's permissions if logged in user is not an admin", async ({
  client,
  assert,
}) => {
  const user = await Factory.model('App/Models/User').create()

  const permissionData = await Factory.model('Adonis/Acl/Permission').create()

  const permission = { ...permissionData.$attributes }

  const response = await client
    .patch(`/users/${user.id}`)
    .loginVia(loginUser)
    .send({ permissions: [permission.id] })
    .end()

  response.assertStatus(403)
})

test("it should not update an existing user's invalid address", async ({
  client,
  assert,
}) => {
  const addressData = await Factory.model('App/Models/Address').create({
    user_id: loginUser.id,
  })
  const address = { ...addressData.$attributes }

  delete address.street

  const response = await client
    .patch(`/users/${loginUser.id}`)
    .loginVia(loginUser)
    .send({ address })
    .end()

  response.assertStatus(400)
})

test('it should not update non existing user', async ({ client }) => {
  const response = await client
    .patch('/users/-1')
    .loginVia(loginUser)
    .send({ username: 'username' })
    .end()

  response.assertStatus(404)
})

test('it should delete an existing user', async ({ client, assert }) => {
  const user = await Factory.model('App/Models/User').create()

  const response = await client
    .delete(`/users/${user.id}`)
    .loginVia(user)
    .send()
    .end()

  const deletedUser = User.find(user.id)

  response.assertStatus(204)
  assert.isEmpty(deletedUser)
})

test('it should delete an existing user if admin', async ({
  client,
  assert,
}) => {
  const user = await Factory.model('App/Models/User').create()

  const response = await client
    .delete(`/users/${user.id}`)
    .loginVia(loginAdmin)
    .send()
    .end()

  const deletedUser = User.find(user.id)

  response.assertStatus(204)
  assert.isEmpty(deletedUser)
})

test('it should not delete an existing user if not self or admin', async ({
  client,
  assert,
}) => {
  const user = await Factory.model('App/Models/User').create()

  const response = await client
    .delete(`/users/${user.id}`)
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(403)
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

  const response = await client.get('/users').loginVia(loginAdmin).send().end()

  response.assertStatus(200)
  assert.equal(7, response.body.data.length)
})

test('it should list a user by id', async ({ client, assert }) => {
  const response = await client
    .get(`/users/${loginUser.id}`)
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.email, loginUser.email)
})

test('it should list a user if admin', async ({ client, assert }) => {
  const response = await client
    .get(`/users/${loginUser.id}`)
    .loginVia(loginAdmin)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.email, loginUser.email)
})

test('it should not list a user if not self or admin', async ({
  client,
  assert,
}) => {
  const user = await Factory.model('App/Models/User').create()

  const response = await client
    .get(`/users/${user.id}`)
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(403)
})

test('it should not show non existent user', async ({ client }) => {
  const response = await client
    .get('/users/-1')
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(404)
})
