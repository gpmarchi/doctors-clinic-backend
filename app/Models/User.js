'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

/** @type {import('@adonisjs/framework/src/Hash')} */
const Hash = use('Hash')

class User extends Model {
  static boot() {
    super.boot()

    /**
     * A hook to hash the user password before saving
     * it to the database.
     */
    this.addHook('beforeSave', async (userInstance) => {
      if (userInstance.dirty.password) {
        userInstance.password = await Hash.make(userInstance.password)
      }
    })
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
}

module.exports = User
