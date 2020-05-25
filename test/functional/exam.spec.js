'use strict'

const { ioc } = require('@adonisjs/fold')

const Role = ioc.use('Adonis/Acl/Role')

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Exam = use('App/Models/Exam')

const { test, trait, before, beforeEach, after } = use('Test/Suite')('Exam')

trait('Test/ApiClient')
trait('Auth/Client')

let loginUser = null

before(async () => {
  await User.truncate()
  await Role.truncate()
  await Exam.truncate()

  loginUser = await Factory.model('App/Models/User').create()

  const adminRole = await Factory.model('Adonis/Acl/Role').create({
    slug: 'administrator',
  })
  await loginUser.roles().attach([adminRole.toJSON().id])
})

beforeEach(async () => {
  await Exam.truncate()
})

after(async () => {
  await loginUser.roles().delete()
})

test('it should create a new exam', async ({ client, assert }) => {
  const examData = await Factory.model('App/Models/Exam').make()
  const exam = examData.toJSON()

  const response = await client
    .post('/exams')
    .loginVia(loginUser)
    .send(exam)
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(response.body.name, exam.name)
})

test('it should update an existent exam', async ({ client, assert }) => {
  const examData = await Factory.model('App/Models/Exam').create()
  const exam = examData.toJSON()

  exam.name = 'updated name'

  const response = await client
    .patch(`/exams/${exam.id}`)
    .loginVia(loginUser)
    .send(exam)
    .end()

  response.assertStatus(200)
  assert.exists(response.body.id)
  assert.equal(response.body.name, exam.name)
})

test('it should not update non existent exam', async ({ client, assert }) => {
  const response = await client
    .patch('/exams/-1')
    .loginVia(loginUser)
    .send({ name: 'name' })
    .end()

  response.assertStatus(404)
})

test('it should delete an existent exam', async ({ client, assert }) => {
  const exam = await Factory.model('App/Models/Exam').create()

  const response = await client
    .delete(`/exams/${exam.id}`)
    .loginVia(loginUser)
    .send()
    .end()

  const deletedExam = Exam.find(exam.id)

  response.assertStatus(204)
  assert.isEmpty(deletedExam)
})

test('it should not delete non existent exam', async ({ client }) => {
  const response = await client
    .delete('/exams/-1')
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(404)
})

test('it should list all exams', async ({ client, assert }) => {
  await Factory.model('App/Models/Exam').createMany(5)

  const response = await client.get('/exams').loginVia(loginUser).send().end()

  response.assertStatus(200)
  assert.equal(5, response.body.data.length)
})

test('it should show an exam by id', async ({ client, assert }) => {
  const exam = await Factory.model('App/Models/Exam').create()

  const response = await client
    .get(`/exams/${exam.id}`)
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(200)
  assert.equal(response.body.name, exam.name)
})

test('it should not show non existent exam', async ({ client }) => {
  const response = await client
    .get('/exams/-1')
    .loginVia(loginUser)
    .send()
    .end()

  response.assertStatus(404)
})
