'use strict'

class Consultation {
  get validateAll() {
    return true
  }

  get rules() {
    return {
      datetime: 'required|date',
      is_return: 'required|boolean',
      pacient_id: 'integer',
      doctor_id: 'required|integer',
      clinic_id: 'required|integer',
    }
  }

  get messages() {
    return this.ctx.antl.list('validation')
  }
}

module.exports = Consultation
