'use strict'

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

/** @typedef {import('@adonisjs/ignitor/src/Helpers')} Helpers */
const Helpers = use('Helpers')

const path = require('path')
const fs = require('fs')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const File = use('App/Models/File')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')

const { test, trait, before, after } = use('Test/Suite')('File')

trait('Test/ApiClient')
trait('Auth/Client')

let loginUser = null

before(async () => {
  await File.query().delete()
  await User.query().delete()

  loginUser = await Factory.model('App/Models/User').create()
})

after(async () => {
  const tmpUploadsDir = Helpers.tmpPath('uploads')
  const files = fs.readdirSync(tmpUploadsDir)
  files.map((file) => fs.unlinkSync(path.join(tmpUploadsDir, file)))
})

test('it should create a new file', async ({ client, assert }) => {
  const fileFixture = path.join(
    Helpers.appRoot(),
    'test',
    'fixtures',
    'avatar.svg'
  )

  const response = await client
    .post('/files')
    .loginVia(loginUser)
    .attach('file', fileFixture)
    .end()

  const files = fs.readdirSync(Helpers.tmpPath('uploads'))

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.exists(response.body.file)
  assert.exists(response.body.name)
  assert.exists(response.body.type)
  assert.exists(response.body.subtype)
  assert.exists(response.body.url)
  assert.equal(1, files.length)
})

test('it should download a file', async ({ client, assert }) => {
  const files = (await File.query().fetch()).toJSON()
  const response = await client
    .get(`/files/${files[0].id}`)
    .loginVia(loginUser)
    .end()

  response.assertStatus(200)
  response.assertHeader('content-type', 'image/svg+xml')
  assert.isTrue(Buffer.isBuffer(response.body))
})

test('it should not create new file if file not present in request', async ({
  client,
  assert,
}) => {
  const fileFixture = path.join(
    Helpers.appRoot(),
    'test',
    'fixtures',
    'avatar.svg'
  )

  const response = await client
    .post('/files')
    .loginVia(loginUser)
    .attach('avatar', fileFixture)
    .end()

  const files = fs.readdirSync(Helpers.tmpPath('uploads'))

  response.assertStatus(400)
  assert.equal(1, files.length)
})
