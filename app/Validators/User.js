'use strict'

class User {
  get validateAll() {
    return true
  }

  get rules() {
    return {
      username: 'required|unique:users',
      email: 'required|email|unique:users',
      password: 'required|confirmed',
      first_name: 'required',
      last_name: 'required',
      age: 'required',
      phone: 'required',
    }
  }

  get messages() {
    return this.ctx.antl.list('validation')
  }
}

module.exports = User
