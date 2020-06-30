'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DiagnosticSchema extends Schema {
  up() {
    this.create('diagnostics', (table) => {
      table.increments()
      table.text('report').notNullable()
      table
        .integer('consultation_id')
        .unsigned()
        .references('id')
        .inTable('consultations')
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
        .notNullable()
      table
        .integer('condition_id')
        .unsigned()
        .references('id')
        .inTable('conditions')
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
        .notNullable()
      table
        .integer('surgery_id')
        .unsigned()
        .references('id')
        .inTable('surgeries')
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
      table.timestamp('operation_date')
      table.timestamps()
    })
  }

  down() {
    this.drop('diagnostics')
  }
}

module.exports = DiagnosticSchema
