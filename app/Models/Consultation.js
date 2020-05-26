'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Consultation extends Model {
  clinic() {
    return this.belongsTo('App/Models/Clinic', 'clinic_id', 'id')
  }

  doctor() {
    return this.belongsTo('App/Models/User', 'doctor_id', 'id')
  }

  pacient() {
    return this.belongsTo('App/Models/User', 'pacient_id', 'id')
  }
}

module.exports = Consultation
