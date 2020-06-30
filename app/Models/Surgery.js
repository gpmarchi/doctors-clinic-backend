'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Surgery extends Model {
  specialty() {
    return this.belongsTo('App/Models/Specialty')
  }
}

module.exports = Surgery
