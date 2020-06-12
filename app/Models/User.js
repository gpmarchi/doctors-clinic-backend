'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class User extends Model {
  static boot() {
    super.boot()

    this.addHook('beforeSave', [
      'UserHook.hashPassword',
      'UserHook.sendForgotPasswordMail',
    ])
  }

  static get hidden() {
    return ['password']
  }

  static get traits() {
    return [
      '@provider:Adonis/Acl/HasRole',
      '@provider:Adonis/Acl/HasPermission',
    ]
  }

  static get computed() {
    return ['fullname']
  }

  getFullname({ first_name, last_name }) {
    return `${first_name} ${last_name}`
  }

  tokens() {
    return this.hasMany('App/Models/Token')
  }

  address() {
    return this.hasOne('App/Models/Address')
  }

  avatar() {
    return this.belongsTo('App/Models/File', 'avatar_id', 'id')
  }

  specialty() {
    return this.belongsTo('App/Models/Specialty')
  }

  clinic() {
    return this.belongsTo('App/Models/Clinic')
  }
}

module.exports = User
