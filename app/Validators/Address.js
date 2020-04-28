'use strict'

class Address {
  get validateAll() {
    return true
  }

  get rules() {
    return {
      street: 'required',
      number: 'required',
      district: 'required',
      city: 'required',
      state: 'required',
      zipcode: 'required',
      country: 'required',
    }
  }

  get messages() {
    return this.ctx.antl.list('validation')
  }
}

module.exports = Address
