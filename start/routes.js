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

Route.post('/users/forgot', 'ForgotPasswordController.store')
Route.patch('/users/forgot', 'ForgotPasswordController.update')

Route.group(() => {
  Route.get('/users', 'UserController.index').middleware('is:administrator')
  Route.get('/users/:id', 'UserController.show')
  Route.patch('/users/:id', 'UserController.update')
  Route.delete('/users/:id', 'UserController.delete')

  Route.post('/files', 'FileController.store')
  Route.get('/files/:id', 'FileController.show')

  Route.resource('specialties', 'SpecialtyController')
    .apiOnly()
    .validator(new Map([[['specialties.store'], ['Specialty']]]))
    .middleware('is:administrator')

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

  Route.resource('medicines', 'MedicineController')
    .apiOnly()
    .validator(new Map([[['medicines.store'], ['Medicine']]]))
    .middleware('is:administrator')
}).middleware(['auth'])
