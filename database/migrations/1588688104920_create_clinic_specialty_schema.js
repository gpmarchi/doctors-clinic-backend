'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ClinicSpecialtySchema extends Schema {
  up() {
    this.create('clinic_specialty', (table) => {
      table.increments()
      table.integer('clinic_id').unsigned().index()
      table
        .foreign('clinic_id')
        .references('id')
        .on('clinics')
        .onDelete('cascade')
      table.integer('specialty_id').unsigned().index()
      table
        .foreign('specialty_id')
        .references('id')
        .on('specialties')
        .onDelete('cascade')
      table.timestamps()
    })
  }

  down() {
    this.drop('clinic_specialty')
  }
}

module.exports = ClinicSpecialtySchema
