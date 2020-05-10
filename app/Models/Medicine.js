'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Medicine extends Model {
  leaflet() {
    return this.belongsTo('App/Models/File', 'leaflet_id', 'id')
  }
}

module.exports = Medicine
