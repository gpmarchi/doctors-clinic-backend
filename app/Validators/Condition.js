'use strict'

class Condition {
  get validateAll() {
    return true
  }

  get rules() {
    return {
      name: 'required|string',
      description: 'string',
    }
  }

  get messages() {
    return this.ctx.antl.list('validation')
  }
}

module.exports = Condition
