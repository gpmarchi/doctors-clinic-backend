'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PrescriptionSchema extends Schema {
  up() {
    this.create('prescriptions', (table) => {
      table.increments()
      table.timestamp('issued_on').notNullable()
      table.timestamp('expires_on').notNullable()
      table.integer('medicine_amount').notNullable()
      table.integer('medicine_frequency').notNullable()
      table.string('medicine_frequency_unit').notNullable()
      table
        .integer('medicine_id')
        .unsigned()
        .references('id')
        .inTable('medicines')
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
      table
        .integer('diagnostic_id')
        .unsigned()
        .references('id')
        .inTable('diagnostics')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
      table.timestamps()
    })
  }

  down() {
    this.drop('prescriptions')
  }
}

module.exports = PrescriptionSchema
