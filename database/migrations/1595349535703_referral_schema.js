'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ReferralSchema extends Schema {
  up() {
    this.create('referrals', (table) => {
      table.increments()
      table.timestamp('date').notNullable()
      table
        .integer('specialty_id')
        .unsigned()
        .references('id')
        .inTable('specialties')
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
    this.drop('referrals')
  }
}

module.exports = ReferralSchema
