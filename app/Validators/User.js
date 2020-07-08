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
      first_name: 'required|string',
      last_name: 'required|string',
      birthdate: 'required|date',
      phone: 'required|string',
    }
  }

  get messages() {
    return this.ctx.antl.list('validation')
  }
}

module.exports = User
