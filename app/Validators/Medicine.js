'use strict'

class Medicine {
  get validateAll() {
    return true
  }

  get rules() {
    return {
      name: 'required|string',
      active_ingredient: 'required|string',
    }
  }

  get messages() {
    return this.ctx.antl.list('validation')
  }
}

module.exports = Medicine
