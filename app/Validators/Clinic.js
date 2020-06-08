'use strict'

class Clinic {
  get validateAll() {
    return true
  }

  get rules() {
    return {
      name: 'required|string',
      phone: 'required',
      cnpj: 'required',
    }
  }

  get messages() {
    return this.ctx.antl.list('validation')
  }
}

module.exports = Clinic
