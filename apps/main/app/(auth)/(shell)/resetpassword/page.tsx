import type { Metadata } from 'next'
import ResetPasswordClient from './_components/ResetPasswordClient'

export const metadata: Metadata = {
  title: 'Set New Password | ShipItHQ',
  description: 'Set a new password for your ShipItHQ account.',
}

export default function ResetPasswordPage() {
  return <ResetPasswordClient />
}
