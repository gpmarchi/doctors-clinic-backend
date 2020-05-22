'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Specialty extends Model {
  clinics() {
    return this.belongsToMany(
      'App/Models/Clinic',
      'specialty_id',
      'clinic_id',
      'id',
      'id'
    )
      .pivotTable('clinic_specialty')
      .withTimestamps()
  }
}

module.exports = Specialty
