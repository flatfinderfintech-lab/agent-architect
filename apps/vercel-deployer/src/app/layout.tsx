import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vercel Deployer',
  description: 'Automated Vercel deployment with environment variable configuration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="font-sans antialiased min-h-screen bg-gradient-to-b from-gray-50 to-white">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
