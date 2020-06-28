'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ExamResultSchema extends Schema {
  up() {
    this.create('exam_results', (table) => {
      table.increments()
      table.text('short_report').notNullable()
      table.date('date').notNullable()
      table
        .integer('exam_request_id')
        .unsigned()
        .references('id')
        .inTable('exam_requests')
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
      table
        .integer('report_id')
        .unsigned()
        .references('id')
        .inTable('files')
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
      table.timestamps()
    })
  }

  down() {
    this.drop('exam_results')
  }
}

module.exports = ExamResultSchema
