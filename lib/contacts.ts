// Edit names/roles here. Override emails via env vars without a redeploy:
// MEAL_SUPPORT_EMAIL and SYSTEMS_SUPPORT_EMAIL
export type Topic = 'meal' | 'systems'

export interface Contact {
  name: string
  role: string
  email: string
}

export const CONTACTS: Record<Topic, Contact> = {
  meal: {
    name: 'Stephanie',
    role: 'MEAL Head',
    email: process.env.MEAL_SUPPORT_EMAIL ?? 'stephanie@example.com',
  },
  systems: {
    name: 'Yousif Jawad',
    role: 'Systems Officer',
    email: process.env.SYSTEMS_SUPPORT_EMAIL ?? 'yousif.jawad@alsamaproject.com',
  },
}
