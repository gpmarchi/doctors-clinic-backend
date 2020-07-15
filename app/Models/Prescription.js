'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Prescription extends Model {
  medicine() {
    return this.hasOne('App/Models/Medicine', 'medicine_id', 'id')
  }

  diagnostic() {
    return this.belongsTo('App/Models/Diagnostic', 'diagnostic_id', 'id')
  }
}

module.exports = Prescription
