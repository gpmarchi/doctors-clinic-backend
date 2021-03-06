'use strict'

/** @type {import('@adonisjs/lucid/src/Database')} */
const Database = use('Database')
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

const { test, trait, before, beforeEach } = use('Test/Suite')('User')

trait('Test/ApiClient')
trait('Auth/Client')

let loginUser
let loginAdmin
let doctorRole
let insertUserPermission

before(async () => {
  await User.query().delete()
  await Role.query().delete()
  await File.query().delete()
  await Database.truncate('role_user')

  loginUser = await Factory.model('App/Models/User').create()

  loginAdmin = await Factory.model('App/Models/User').create()

  const adminRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'administrator',
  })
  await loginAdmin.roles().attach([adminRole.toJSON().id])

  doctorRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'doctor',
  })

  insertUserPermission = await Factory.model('Adonis/Acl/Permission').create({
    slug: 'can insert user',
  })
})

beforeEach(async () => {
  await Address.query().delete()
  await Specialty.query().delete()
  await Role.query().whereNotIn('slug', ['administrator', 'doctor']).delete()
  await Permission.query().whereNot('slug', 'can insert user').delete()
  await User.query()
    .whereNotIn('username', [`${loginUser.username}`, `${loginAdmin.username}`])
    .delete()
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

test('it should create a new user with role', async ({ client, assert }) => {
  const user = await Factory.model('App/Models/User').make({
    password: 'slkj239ru!',
    password_confirmation: 'slkj239ru!',
  })

  const userData = { roles: [doctorRole.id], ...user.$attributes }

  const response = await client.post('/users').send(userData).end()

  response.assertStatus(200)
  assert.exists(response.body.username)
  assert.exists(response.body.fullname)
  assert.equal(response.body.username, userData.username)
  assert.equal(
    response.body.fullname,
    `${userData.first_name} ${userData.last_name}`
  )
  assert.include(response.body.roles[0], doctorRole.toJSON())
})

test('it should create a new user with permission', async ({
  client,
  assert,
}) => {
  const user = await Factory.model('App/Models/User').make({
    password: 'slkj239ru!',
    password_confirmation: 'slkj239ru!',
  })

  const userData = {
    permissions: [insertUserPermission.id],
    ...user.$attributes,
  }

  const response = await client.post('/users').send(userData).end()

  response.assertStatus(200)
  assert.exists(response.body.username)
  assert.exists(response.body.fullname)
  assert.equal(response.body.username, userData.username)
  assert.equal(
    response.body.fullname,
    `${userData.first_name} ${userData.last_name}`
  )
  assert.include(response.body.permissions[0], insertUserPermission.toJSON())
})

test('it should create a new user with avatar', async ({ client, assert }) => {
  const userData = await Factory.model('App/Models/User').make({
    password: 'slkj239ru!',
    password_confirmation: 'slkj239ru!',
  })
  const user = userData.$attributes

  const fileData = await Factory.model('App/Models/File').create()
  const file = fileData.toJSON()

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
  const address = { ...addressData.toJSON() }

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
  const address = { ...addressData.toJSON() }
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
  const specialty = { ...specialtyData.toJSON() }

  const response = await client
    .post('/users')
    .send({ ...user, specialty_id: specialty.id })
    .end()

  response.assertStatus(200)
  assert.exists(response.body.username)
  assert.equal(response.body.username, user.username)
  assert.include(response.body.specialty, specialty)
})

test('it should create a new user with clinic', async ({ client, assert }) => {
  const clinicData = await Factory.model('App/Models/Clinic').create()
  const clinic = clinicData.toJSON()

  const userData = await Factory.model('App/Models/User').make({
    password: 'slkj239ru!',
    password_confirmation: 'slkj239ru!',
  })

  const user = userData.$attributes

  const response = await client
    .post('/users')
    .send({ ...user, clinic_id: clinic.id })
    .end()

  response.assertStatus(200)
  assert.exists(response.body.username)
  assert.equal(response.body.username, user.username)
  assert.include(response.body.clinic, clinic)
})

test("it should create an existing user's address", async ({
  client,
  assert,
}) => {
  const addressData = await Factory.model('App/Models/Address').make()
  const address = { ...addressData.toJSON() }

  const response = await client
    .patch(`/users/${loginUser.id}`)
    .loginVia(loginUser)
    .send({ address })
    .end()

  response.assertStatus(200)
  assert.include(response.body.address, address)
})

test('it should update an existing user', async ({ client, assert }) => {
  const userData = await Factory.model('App/Models/User').create()

  const response = await client
    .patch(`/users/${userData.id}`)
    .loginVia(userData)
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
  const userData = await Factory.model('App/Models/User').create()

  const response = await client
    .patch(`/users/${userData.id}`)
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
  const address = { ...addressData.toJSON() }

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
  const specialty = { ...specialtyData.toJSON() }
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

test("it should update an existing user's clinic", async ({
  client,
  assert,
}) => {
  const clinicData = await Factory.model('App/Models/Clinic').create()
  const clinic = clinicData.toJSON()
  delete clinic.created_at
  delete clinic.updated_at

  const response = await client
    .patch(`/users/${loginUser.id}`)
    .loginVia(loginUser)
    .send({ clinic_id: clinic.id })
    .end()

  response.assertStatus(200)
  assert.include(response.body.clinic, clinic)
})

test("it should update an existing user's roles", async ({
  client,
  assert,
}) => {
  const user = await Factory.model('App/Models/User').create()

  const roleData = await Factory.model('Adonis/Acl/Role').create()
  const role = { ...roleData.toJSON() }

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
  const role = { ...roleData.toJSON() }

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
  const permission = { ...permissionData.toJSON() }

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

  const permission = { ...permissionData.toJSON() }

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
  const address = { ...addressData.toJSON() }

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
