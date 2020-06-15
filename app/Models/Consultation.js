'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Consultation extends Model {
  static boot() {
    super.boot()

    this.addHook('beforeSave', [
      'ConsultationHook.sendConsultationScheduleMail',
    ])
  }

  clinic() {
    return this.belongsTo('App/Models/Clinic', 'clinic_id', 'id')
  }

  doctor() {
    return this.belongsTo('App/Models/User', 'doctor_id', 'id')
  }

  patient() {
    return this.belongsTo('App/Models/User', 'patient_id', 'id')
  }
}

module.exports = Consultation
