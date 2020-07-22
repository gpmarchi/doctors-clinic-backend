'use strict'

/*
|--------------------------------------------------------------------------
| UserSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

const { ioc } = require('@adonisjs/fold')

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

const Role = ioc.use('Adonis/Acl/Role')

class UserSeeder {
  async run() {
    const adminRole = await Role.findBy('slug', 'administrator')

    const admin = await Factory.model('App/Models/User').create({
      username: 'admin',
      email: 'administrator@gmail.com',
      password: '1234',
      first_name: 'Administrator',
      last_name: '',
      birthdate: '01-01-1970',
      phone: '(11)99999-9999',
    })

    await admin.roles().attach([adminRole.id])
  }
}

module.exports = UserSeeder
