import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SignInButton, SignUpButton } from '@clerk/nextjs'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl w-full space-y-8 text-center">
        <h1 className="text-6xl font-bold tracking-tight text-gray-900">
          Prototype.Cafe Agent Creator
        </h1>

        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Build, deploy, and monetize AI agents without coding.
          Create powerful automation with our no-code platform powered by cutting-edge LLMs.
        </p>

        <div className="flex gap-4 justify-center mt-8">
          <SignUpButton mode="modal">
            <Button size="lg" className="text-lg px-8 py-6">
              Get Started Free
            </Button>
          </SignUpButton>

          <SignInButton mode="modal">
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              Sign In
            </Button>
          </SignInButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="p-6 rounded-lg border bg-white shadow-sm">
            <h3 className="text-xl font-semibold mb-2">🤖 Create Agents</h3>
            <p className="text-gray-600">
              Build AI agents with simple prompts. No coding required.
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-white shadow-sm">
            <h3 className="text-xl font-semibold mb-2">🛠️ Tool Store</h3>
            <p className="text-gray-600">
              Browse and attach powerful tools like web search, email, and APIs.
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-white shadow-sm">
            <h3 className="text-xl font-semibold mb-2">💰 Marketplace</h3>
            <p className="text-gray-600">
              Publish your agents and earn revenue from subscriptions.
            </p>
          </div>
        </div>

        <div className="pt-8">
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            View Dashboard →
          </Link>
        </div>
      </div>
    </main>
  )
}
