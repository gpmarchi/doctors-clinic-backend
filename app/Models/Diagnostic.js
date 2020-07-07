'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Diagnostic extends Model {
  consultation() {
    return this.belongsTo('App/Models/Consultation', 'consultation_id', 'id')
  }
}

module.exports = Diagnostic
