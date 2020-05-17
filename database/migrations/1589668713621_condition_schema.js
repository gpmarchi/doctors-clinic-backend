'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ConditionSchema extends Schema {
  up() {
    this.create('conditions', (table) => {
      table.increments()
      table.string('name').notNullable()
      table.text('description')
      table
        .integer('specialty_id')
        .unsigned()
        .references('id')
        .inTable('specialties')
        .onUpdate('CASCADE')
        .onDelete('SET NULL')
      table.timestamps()
    })
  }

  down() {
    this.drop('conditions')
  }
}

module.exports = ConditionSchema
