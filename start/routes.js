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

  Route.get('/schedules', 'ClinicScheduleController.index').middleware(
    'is:(patient or assistant)'
  )

  Route.get('/consultations', 'ConsultationController.index').middleware(
    'is:assistant'
  )
  Route.get('/consultations/:id', 'ConsultationController.show').middleware(
    'is:(assistant or doctor or patient)'
  )
  Route.delete(
    '/consultations/:id',
    'ConsultationController.destroy'
  ).middleware('is:(patient or assistant)')
  Route.post('/consultations', 'ConsultationController.store')
    .validator('Consultation')
    .middleware('is:(patient or assistant)')
  Route.patch('/consultations/:id', 'ConsultationController.update').middleware(
    'is:(patient or assistant)'
  )

  Route.patch(
    '/consultation/:id/exams',
    'ExamRequestsController.update'
  ).middleware('is:doctor')

  Route.patch(
    '/confirmations/consultation/:id',
    'ConfirmationController.update'
  ).middleware('is:patient')

  Route.get(
    '/patient/consultations',
    'PatientConsultationController.index'
  ).middleware('is:patient')

  Route.get(
    '/doctor/consultations',
    'DoctorConsultationController.index'
  ).middleware('is:doctor')

  Route.post('/exam/results', 'ExamResultController.store')
    .validator('ExamResult')
    .middleware('is:doctor')
  Route.patch('/exam/results/:id', 'ExamResultController.update').middleware(
    'is:doctor'
  )
  Route.delete('/exam/results/:id', 'ExamResultController.destroy').middleware(
    'is:doctor'
  )

  Route.post('/referrals', 'ReferralController.store')
    .validator('Referral')
    .middleware('is:doctor')
  Route.patch('/referrals/:id', 'ReferralController.update').middleware(
    'is:doctor'
  )
  Route.delete('/referrals/:id', 'ReferralController.destroy').middleware(
    'is:doctor'
  )

  Route.resource('specialties', 'SpecialtyController')
    .apiOnly()
    .except(['index', 'show'])
    .validator(new Map([[['specialties.store'], ['Specialty']]]))
    .middleware('is:administrator')
  Route.get('/specialties', 'SpecialtyController.index').middleware(
    'is:(patient or administrator)'
  )
  Route.get('/specialties/:id', 'SpecialtyController.show').middleware(
    'is:(patient or administrator)'
  )

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

  Route.resource('exams', 'ExamController')
    .apiOnly()
    .validator(new Map([[['exams.store'], ['Exam']]]))
    .middleware('is:administrator')

  Route.resource('conditions', 'ConditionController')
    .apiOnly()
    .validator(new Map([[['conditions.store'], ['Condition']]]))
    .middleware('is:administrator')

  Route.resource('surgeries', 'SurgeryController')
    .apiOnly()
    .validator(new Map([[['surgeries.store'], ['Surgery']]]))
    .middleware('is:administrator')

  Route.resource('timetables', 'TimetableController')
    .apiOnly()
    .validator(new Map([[['timetables.store'], ['Timetable']]]))
    .middleware('is:(doctor or administrator)')

  Route.resource('diagnostics', 'DiagnosticController')
    .apiOnly()
    .validator(new Map([[['diagnostics.store'], ['Diagnostic']]]))
    .middleware('is:doctor')

  Route.resource('prescriptions', 'PrescriptionController')
    .apiOnly()
    .validator(new Map([[['prescriptions.store'], ['Prescription']]]))
    .middleware('is:doctor')
}).middleware(['auth'])
