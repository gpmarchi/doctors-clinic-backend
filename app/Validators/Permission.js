'use strict'

class Permission {
  get validateAll() {
    return true
  }

  get rules() {
    return {
      slug: 'required|string|unique:roles',
      name: 'required|string|unique:roles',
    }
  }

  get messages() {
    return this.ctx.antl.list('validation')
  }
}

module.exports = Permission
