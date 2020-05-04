'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URLs and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

Route.post('/sessions', 'SessionController.store')
Route.post('/users', 'UserController.store').validator('User')

Route.group(() => {
  Route.get('/users', 'UserController.index')
  Route.get('/users/:id', 'UserController.show')
  Route.patch('/users/:id', 'UserController.update')
  Route.delete('/users/:id', 'UserController.delete')

  Route.resource('specialties', 'SpecialtyController')
    .apiOnly()
    .validator(new Map([[['specialties.store'], ['Specialty']]]))

  Route.resource('roles', 'RoleController')
    .apiOnly()
    .validator(new Map([[['roles.store'], ['Role']]]))
    .middleware('is:administrator')

  Route.resource('permissions', 'PermissionController')
    .apiOnly()
    .validator(new Map([[['permissions.store'], ['Permission']]]))
    .middleware('is:administrator')

  Route.resource('clinics', 'ClinicController')
    .apiOnly()
    .validator(new Map([[['clinics.store'], ['Clinic']]]))
    .middleware('is:administrator')
}).middleware(['auth'])
