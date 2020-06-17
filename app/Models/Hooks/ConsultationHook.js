'use strict'

const Kue = use('Kue')
const Job = use('App/Jobs/ConsultationScheduleMail')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Clinic = use('App/Models/Clinic')

const ConsultationHook = (exports = module.exports = {})

ConsultationHook.sendConsultationScheduleMail = async (
  consultationInstance
) => {
  if (
    consultationInstance.dirty.datetime ||
    consultationInstance.dirty.doctor_id ||
    consultationInstance.dirty.clinic_id
  ) {
    const doctor = await User.find(consultationInstance.doctor_id)
    await doctor.load('specialty')
    const patient = await User.find(consultationInstance.patient_id)
    const clinic = await Clinic.find(consultationInstance.clinic_id)
    await clinic.load('owner')

    Kue.dispatch(
      Job.key,
      {
        patient: patient.toJSON(),
        date: consultationInstance.datetime,
        clinic: clinic.name,
        specialty: doctor.toJSON().specialty.name,
        doctor: doctor.toJSON().fullname,
        phone: clinic.phone,
        owner: clinic.toJSON().owner,
      },
      { attempts: 3 }
    )
  }
}
