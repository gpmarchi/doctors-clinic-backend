'use strict'

class Prescription {
  get validateAll() {
    return true
  }

  get rules() {
    return {
      expires_on: 'date',
      medicine_amount: 'required|integer',
      medicine_frequency: 'required|integer',
      medicine_frequency_unit: 'required|string',
      medicine_id: 'required|integer',
      diagnostic_id: 'required|integer',
    }
  }

  get messages() {
    return this.ctx.antl.list('validation')
  }
}

module.exports = Prescription
