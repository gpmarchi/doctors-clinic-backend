'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Clinic extends Model {
  address() {
    return this.hasOne('App/Models/Address')
  }

  owner() {
    return this.belongsTo('App/Models/User', 'owner_id', 'id')
  }

  specialties() {
    return this.belongsToMany(
      'App/Models/Specialty',
      'clinic_id',
      'specialty_id',
      'id',
      'id'
    )
      .pivotTable('clinic_specialty')
      .withTimestamps()
  }

  timetables() {
    return this.belongsToMany(
      'App/Models/User',
      'clinic_id',
      'doctor_id',
      'id',
      'id'
    )
      .pivotTable('timetables')
      .withPivot(['datetime'])
      .withTimestamps()
  }
}

module.exports = Clinic
