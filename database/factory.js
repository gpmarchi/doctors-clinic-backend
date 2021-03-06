'use strict'

/*
|--------------------------------------------------------------------------
| Factory
|--------------------------------------------------------------------------
|
| Factories are used to define blueprints for database tables or Lucid
| models. Later you can use these blueprints to seed your database
| with dummy data.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

Factory.blueprint('App/Models/User', (faker, i, data = {}) => {
  return {
    username: faker.string(),
    email: faker.email(),
    password: faker.string(),
    first_name: faker.first(),
    last_name: faker.last(),
    birthdate: faker.birthday(),
    phone: faker.phone(),
    ...data,
  }
})

Factory.blueprint('App/Models/Address', (faker, i, data = {}) => {
  return {
    street: faker.street(),
    number: faker.string({ length: 3, alpha: false, numeric: true }),
    district: faker.province(),
    city: faker.city(),
    state: faker.state(),
    zipcode: faker.zip(),
    country: faker.country(),
    ...data,
  }
})

Factory.blueprint('App/Models/Specialty', (faker, i, data = {}) => {
  return {
    name: faker.string(),
    description: faker.sentence(),
    ...data,
  }
})

Factory.blueprint('Adonis/Acl/Role', (faker, i, data = {}) => {
  return {
    slug: faker.string(),
    name: faker.string(),
    description: faker.paragraph(),
    ...data,
  }
})

Factory.blueprint('Adonis/Acl/Permission', (faker, i, data = {}) => {
  return {
    slug: faker.string(),
    name: faker.string(),
    description: faker.paragraph(),
    ...data,
  }
})

Factory.blueprint('App/Models/Clinic', (faker, i, data = {}) => {
  return {
    name: faker.string(),
    phone: faker.string({ alpha: false, numeric: true }),
    cnpj: faker.string({ length: 14, alpha: false, numeric: true }),
    ...data,
  }
})

Factory.blueprint('App/Models/File', (faker, i, data = {}) => {
  return {
    file: faker.string(),
    name: faker.string(),
    type: faker.string(),
    subtype: faker.string({ length: 3 }),
    ...data,
  }
})

Factory.blueprint('App/Models/Medicine', (faker, i, data = {}) => {
  return {
    name: faker.string(),
    active_ingredient: faker.string(),
    contra_indications: faker.paragraph(),
    ...data,
  }
})

Factory.blueprint('App/Models/Exam', (faker, i, data = {}) => {
  return {
    name: faker.string(),
    description: faker.paragraph(),
    ...data,
  }
})

Factory.blueprint('App/Models/Condition', (faker, i, data = {}) => {
  return {
    name: faker.string(),
    description: faker.sentence(),
    ...data,
  }
})

Factory.blueprint('App/Models/Surgery', (faker, i, data = {}) => {
  return {
    name: faker.string(),
    description: faker.paragraph(),
    ...data,
  }
})

Factory.blueprint('App/Models/Timetable', (faker, i, data = {}) => {
  return {
    datetime: new Date(),
    scheduled: faker.bool({ likelihood: 0 }),
    ...data,
  }
})

Factory.blueprint('App/Models/Consultation', (faker, i, data = {}) => {
  return {
    datetime: new Date(),
    is_return: faker.bool({ likelihood: 0 }),
    confirmed: faker.bool({ likelihood: 0 }),
    ...data,
  }
})

Factory.blueprint('App/Models/ExamResult', (faker, i, data = {}) => {
  return {
    short_report: faker.sentence(),
    date: faker.date(),
    ...data,
  }
})

Factory.blueprint('App/Models/Diagnostic', (faker, i, data = {}) => {
  return {
    report: faker.sentence(),
    ...data,
  }
})

Factory.blueprint('App/Models/Prescription', (faker, i, data = {}) => {
  return {
    expires_on: faker.date(),
    medicine_amount: faker.integer({ min: 1, max: 10 }),
    medicine_frequency: faker.integer({ min: 1, max: 10 }),
    medicine_frequency_unit: 'DAY',
    ...data,
  }
})

Factory.blueprint('App/Models/Referral', (faker, i, data = {}) => {
  return {
    date: faker.date(),
    ...data,
  }
})
