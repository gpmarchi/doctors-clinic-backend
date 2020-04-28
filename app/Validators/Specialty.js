'use strict'

class Specialty {
  get validateAll() {
    return true
  }

  get rules() {
    return {
      name: 'required',
    }
  }

  get messages() {
    return this.ctx.antl.list('validation')
  }
}

module.exports = Specialty
