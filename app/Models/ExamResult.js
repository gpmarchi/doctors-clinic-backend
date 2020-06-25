'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ExamResult extends Model {
  report() {
    return this.belongsTo('App/Models/File', 'report_id', 'id')
  }
}

module.exports = ExamResult
