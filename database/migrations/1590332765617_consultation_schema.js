'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ConsultationSchema extends Schema {
  up() {
    this.create('consultations', (table) => {
      table.increments()
      table.timestamp('datetime').notNullable()
      table.boolean('is_return').notNullable().defaultTo(false)
      table
        .integer('pacient_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
        .notNullable()
      table
        .integer('doctor_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
        .notNullable()
      table
        .integer('clinic_id')
        .unsigned()
        .references('id')
        .inTable('clinics')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
        .notNullable()
      table.timestamps()
    })
  }

  down() {
    this.drop('consultations')
  }
}

module.exports = ConsultationSchema
