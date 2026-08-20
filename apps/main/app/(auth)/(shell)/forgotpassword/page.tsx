import type { Metadata } from 'next'
import ForgotPasswordClient from './_components/ForgotPasswordClient'

export const metadata: Metadata = {
  title: 'Reset Password | ShipItHQ',
  description: 'Reset your ShipItHQ account password.',
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />
}
