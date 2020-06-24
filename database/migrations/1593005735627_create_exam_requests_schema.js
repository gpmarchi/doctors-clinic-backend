'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CreateExamRequestsSchema extends Schema {
  up() {
    this.create('exam_requests', (table) => {
      table.increments()
      table.timestamp('date').notNullable()
      table
        .integer('exam_id')
        .unsigned()
        .references('id')
        .inTable('exams')
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
      table
        .integer('consultation_id')
        .unsigned()
        .references('id')
        .inTable('consultations')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
      table.timestamps()
    })
  }

  down() {
    this.drop('exam_requests')
  }
}

module.exports = CreateExamRequestsSchema
