'use strict'

class Timetable {
  get validateAll() {
    return true
  }

  get rules() {
    return {
      datetime: 'required|date',
      clinic_id: 'required|integer',
    }
  }

  get messages() {
    return this.ctx.antl.list('validation')
  }
}

module.exports = Timetable
