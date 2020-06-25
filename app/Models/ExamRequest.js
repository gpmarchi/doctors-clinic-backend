'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ExamRequest extends Model {
  exam() {
    return this.belongsTo('App/Models/Exam', 'exam_id', 'id')
  }

  consultation() {
    return this.belongsTo('App/Models/Consultation', 'consultation_id', 'id')
  }

  result() {
    return this.hasOne('App/Models/ExamResult')
  }
}

module.exports = ExamRequest
