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
    age: faker.age(),
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
