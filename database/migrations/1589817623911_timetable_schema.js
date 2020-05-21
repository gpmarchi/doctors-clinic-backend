'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TimetableSchema extends Schema {
  up() {
    this.create('timetables', (table) => {
      table.increments()
      table.timestamp('datetime').notNullable()
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
    this.drop('timetables')
  }
}

module.exports = TimetableSchema
