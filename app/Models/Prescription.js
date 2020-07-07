'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Prescription extends Model {
  medicine() {
    return this.belongsTo('App/Models/Medicine')
  }
}

module.exports = Prescription
