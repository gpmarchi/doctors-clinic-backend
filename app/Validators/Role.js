'use strict'

class Role {
  get validateAll() {
    return true
  }

  get rules() {
    return {
      slug: 'required|unique:roles',
      name: 'required|unique:roles',
    }
  }

  get messages() {
    return this.ctx.antl.list('validation')
  }
}

module.exports = Role
