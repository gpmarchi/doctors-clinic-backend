'use strict'

/** @typedef {import('@adonisjs/mail/src/Mail')} Mail */
const Mail = use('Mail')

class ConsultationScheduleMail {
  static get concurrency() {
    return 1
  }

  static get key() {
    return 'ConsultationScheduleMail-job'
  }

  async handle({ patient, date, clinic, specialty, doctor, phone, owner }) {
    console.log('ConsultationScheduleMail-job started')

    await Mail.send(
      ['emails.consultation_confirmation'],
      {
        patient: patient.fullname,
        date,
        clinic,
        specialty,
        doctor,
        phone,
      },
      (message) => {
        message
          .to(patient.email)
          .from(owner.email, `${owner.fullname} | Doctor's Clinic`)
          .subject('Confirmação de agendamento de consulta')
      }
    )
  }
}

module.exports = ConsultationScheduleMail
