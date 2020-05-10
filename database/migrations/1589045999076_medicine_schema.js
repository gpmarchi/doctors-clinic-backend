'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MedicineSchema extends Schema {
  up() {
    this.create('medicines', (table) => {
      table.increments()
      table.string('name').notNullable()
      table.string('active_ingredient').notNullable()
      table.text('contra_indications')
      table
        .integer('leaflet_id')
        .unsigned()
        .references('id')
        .inTable('files')
        .onUpdate('CASCADE')
        .onDelete('SET NULL')
      table.timestamps()
    })
  }

  down() {
    this.drop('medicines')
  }
}

module.exports = MedicineSchema
