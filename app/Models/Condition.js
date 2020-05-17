'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Condition extends Model {
  specialty() {
    return this.belongsTo('App/Models/Specialty')
  }
}

module.exports = Condition
