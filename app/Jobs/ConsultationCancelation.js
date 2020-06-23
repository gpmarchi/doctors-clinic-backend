'use strict'

const Kue = use('Kue')
/** @typedef {import('@adonisjs/mail/src/Mail')} Mail */
const Mail = use('Mail')
const dateFns = use('date-fns')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Consultation = use('App/Models/Consultation')

class ConsultationCancelation {
  constructor() {
    ;(async function verifyConsultationsToCancel() {
      const startDate = dateFns.add(
        dateFns.set(new Date(), {
          hours: 0,
          minutes: 0,
          seconds: 0,
        }),
        { days: 2 }
      )

      const endDate = dateFns.add(
        dateFns.set(new Date(), {
          hours: 23,
          minutes: 59,
          seconds: 59,
        }),
        { days: 2 }
      )

      const consultations = await Consultation.query()
        .whereBetween('datetime', [startDate, endDate])
        .with('clinic', (builder) => builder.with('owner'))
        .with('doctor', (builder) => builder.with('specialty'))
        .with('patient')
        .fetch()

      Kue.dispatch(ConsultationCancelation.key, consultations.toJSON(), {
        attempts: 3,
      })

      setTimeout(verifyConsultationsToCancel, 86400000)
    })()
  }

  static get concurrency() {
    return 1
  }

  static get key() {
    return 'ConsultationCancelation-job'
  }

  async handle(data) {
    console.log('ConsultationCancelation-job started')

    data.map(async (consultation) => {
      await Mail.send(
        ['emails.consultation_cancelation'],
        {
          patient: consultation.patient.fullname,
          date: dateFns.format(consultation.datetime, 'dd/MM/yyyy HH:mm'),
          clinic: consultation.clinic.name,
          phone: consultation.clinic.phone,
          specialty: consultation.doctor.specialty.name,
          doctor: consultation.doctor.fullname,
        },
        (message) => {
          message
            .to(consultation.patient.email)
            .from(
              consultation.clinic.owner.email,
              `${consultation.clinic.owner.fullname} | Doctor's Clinic`
            )
            .subject('Cancelamento de consulta')
        }
      )

      const consultationToCancel = await Consultation.find(consultation.id)
      await consultationToCancel.delete()
    })
  }
}

module.exports = ConsultationCancelation
