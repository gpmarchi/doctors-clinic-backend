'use strict'

class Diagnostic {
  get validateAll() {
    return true
  }

  get rules() {
    return {
      report: 'required|string',
      consultation_id: 'required|integer',
      condition_id: 'required|integer',
      surgery_id: 'integer',
      operation_date: 'date',
    }
  }

  get messages() {
    return this.ctx.antl.list('validation')
  }
}

module.exports = Diagnostic
