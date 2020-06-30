'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SurgerySchema extends Schema {
  up() {
    this.create('surgeries', (table) => {
      table.increments()
      table.string('name').notNullable()
      table.text('description').notNullable()
      table
        .integer('specialty_id')
        .unsigned()
        .references('id')
        .inTable('specialties')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
      table.timestamps()
    })
  }

  down() {
    this.drop('surgeries')
  }
}

module.exports = SurgerySchema
