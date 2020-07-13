'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ClinicSchema extends Schema {
  up() {
    this.create('clinics', (table) => {
      table.increments()
      table.string('name').notNullable()
      table.string('phone').notNullable()
      table.string('cnpj').notNullable().unique()
      table.timestamps()
    })
  }

  down() {
    this.drop('clinics')
  }
}

module.exports = ClinicSchema
