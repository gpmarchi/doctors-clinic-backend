'use strict'

class Referral {
  get validateAll() {
    return true
  }

  get rules() {
    return {
      date: 'required|date',
      specialty_id: 'required|integer',
      consultation_id: 'required|integer',
    }
  }

  get messages() {
    return this.ctx.antl.list('validation')
  }
}

module.exports = Referral
