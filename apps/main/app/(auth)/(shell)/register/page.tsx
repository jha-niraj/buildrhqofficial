import type { Metadata } from 'next'
import RegisterClient from './_components/RegisterClient'

export const metadata: Metadata = {
  title: 'Create Account | ShipItHQ',
  description: 'Join ShipItHQ and start your developer career journey with projects, mock interviews, and AI-powered tools.',
}

export default function RegisterPage() {
  return <RegisterClient />
}
