'use strict'

class Surgery {
  get validateAll() {
    return true
  }

  get rules() {
    return {
      name: 'required|string',
      description: 'required|string',
      specialty_id: 'required|integer',
    }
  }

  get messages() {
    return this.ctx.antl.list('validation')
  }
}

module.exports = Surgery
