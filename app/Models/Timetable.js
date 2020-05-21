'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Timetable extends Model {
  doctor() {
    return this.belongsTo('App/Models/User', 'doctor_id', 'id')
  }

  clinic() {
    return this.belongsTo('App/Models/Clinic', 'clinic_id', 'id')
  }
}

module.exports = Timetable
