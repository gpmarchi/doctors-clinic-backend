'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ClinicSchema extends Schema {
  up() {
    this.alter('clinics', (table) => {
      table
        .integer('owner_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onUpdate('CASCADE')
        .onDelete('SET NULL')
    })
  }

  down() {
    this.alter('clinics', (table) => {
      table.dropColumn('owner_id')
    })
  }
}

module.exports = ClinicSchema
