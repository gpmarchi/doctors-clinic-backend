'use strict'

class Address {
  get validateAll() {
    return true
  }

  get rules() {
    return {
      street: 'required|string',
      number: 'required|string',
      district: 'required|string',
      city: 'required|string',
      state: 'required|string',
      zipcode: 'required|string',
      country: 'required|string',
    }
  }

  get messages() {
    return this.ctx.antl.list('validation')
  }
}

module.exports = Address
