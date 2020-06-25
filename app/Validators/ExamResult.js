'use strict'

class ExamResult {
  get validateAll() {
    return true
  }

  get rules() {
    return {
      short_report: 'required|string',
      date: 'required|date',
      exam_request_id: 'required|integer',
      report_id: 'integer',
    }
  }

  get messages() {
    return this.ctx.antl.list('validation')
  }
}

module.exports = ExamResult
