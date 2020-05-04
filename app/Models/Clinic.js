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
}

module.exports = Clinic
