import type { EnvVariable, EnvCategory, DetectedService, ProjectFile } from '@/types/deployment'

// Known services and their environment variable patterns
const SERVICE_PATTERNS: Record<string, DetectedService> = {
  supabase: {
    name: 'Supabase',
    envVars: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    category: 'database',
    setupUrl: 'https://supabase.com/dashboard',
    description: 'Open source Firebase alternative with Postgres database',
  },
  openai: {
    name: 'OpenAI',
    envVars: ['OPENAI_API_KEY', 'OPENAI_ORG_ID'],
    category: 'api_keys',
    setupUrl: 'https://platform.openai.com/api-keys',
    description: 'GPT models and AI API',
  },
  anthropic: {
    name: 'Anthropic',
    envVars: ['ANTHROPIC_API_KEY'],
    category: 'api_keys',
    setupUrl: 'https://console.anthropic.com/settings/keys',
    description: 'Claude AI models',
  },
  stripe: {
    name: 'Stripe',
    envVars: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
    category: 'payment',
    setupUrl: 'https://dashboard.stripe.com/apikeys',
    description: 'Payment processing platform',
  },
  clerk: {
    name: 'Clerk',
    envVars: ['CLERK_SECRET_KEY', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_WEBHOOK_SECRET'],
    category: 'authentication',
    setupUrl: 'https://dashboard.clerk.com',
    description: 'Authentication and user management',
  },
  auth0: {
    name: 'Auth0',
    envVars: ['AUTH0_SECRET', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET', 'AUTH0_DOMAIN'],
    category: 'authentication',
    setupUrl: 'https://manage.auth0.com',
    description: 'Identity platform for authentication',
  },
  nextauth: {
    name: 'NextAuth.js',
    envVars: ['NEXTAUTH_SECRET', 'NEXTAUTH_URL'],
    category: 'authentication',
    setupUrl: 'https://next-auth.js.org/getting-started/example',
    description: 'Authentication for Next.js',
  },
  resend: {
    name: 'Resend',
    envVars: ['RESEND_API_KEY'],
    category: 'email',
    setupUrl: 'https://resend.com/api-keys',
    description: 'Email API for developers',
  },
  sendgrid: {
    name: 'SendGrid',
    envVars: ['SENDGRID_API_KEY'],
    category: 'email',
    setupUrl: 'https://app.sendgrid.com/settings/api_keys',
    description: 'Email delivery service',
  },
  aws: {
    name: 'AWS',
    envVars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET'],
    category: 'storage',
    setupUrl: 'https://console.aws.amazon.com/iam',
    description: 'Amazon Web Services cloud platform',
  },
  cloudinary: {
    name: 'Cloudinary',
    envVars: ['CLOUDINARY_URL', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
    category: 'storage',
    setupUrl: 'https://cloudinary.com/console',
    description: 'Media management and delivery',
  },
  mongodb: {
    name: 'MongoDB',
    envVars: ['MONGODB_URI', 'MONGO_URI', 'DATABASE_URL'],
    category: 'database',
    setupUrl: 'https://cloud.mongodb.com',
    description: 'Document database',
  },
  postgres: {
    name: 'PostgreSQL',
    envVars: ['DATABASE_URL', 'POSTGRES_URL', 'PG_CONNECTION_STRING'],
    category: 'database',
    setupUrl: 'https://neon.tech',
    description: 'Relational database',
  },
  redis: {
    name: 'Redis',
    envVars: ['REDIS_URL', 'REDIS_HOST', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
    category: 'database',
    setupUrl: 'https://upstash.com',
    description: 'In-memory data store',
  },
  qdrant: {
    name: 'Qdrant',
    envVars: ['QDRANT_URL', 'QDRANT_API_KEY'],
    category: 'database',
    setupUrl: 'https://qdrant.tech/documentation/cloud/',
    description: 'Vector database for AI applications',
  },
  pinecone: {
    name: 'Pinecone',
    envVars: ['PINECONE_API_KEY', 'PINECONE_ENVIRONMENT', 'PINECONE_INDEX'],
    category: 'database',
    setupUrl: 'https://app.pinecone.io',
    description: 'Vector database for embeddings',
  },
  vercel: {
    name: 'Vercel',
    envVars: ['VERCEL_URL', 'VERCEL_ENV'],
    category: 'other',
    setupUrl: 'https://vercel.com/account/tokens',
    description: 'Deployment platform',
  },
  sentry: {
    name: 'Sentry',
    envVars: ['SENTRY_DSN', 'SENTRY_AUTH_TOKEN'],
    category: 'analytics',
    setupUrl: 'https://sentry.io/settings/account/api/auth-tokens/',
    description: 'Error tracking and performance monitoring',
  },
  posthog: {
    name: 'PostHog',
    envVars: ['NEXT_PUBLIC_POSTHOG_KEY', 'POSTHOG_API_KEY'],
    category: 'analytics',
    setupUrl: 'https://app.posthog.com/project/settings',
    description: 'Product analytics platform',
  },
  mixpanel: {
    name: 'Mixpanel',
    envVars: ['MIXPANEL_TOKEN', 'NEXT_PUBLIC_MIXPANEL_TOKEN'],
    category: 'analytics',
    setupUrl: 'https://mixpanel.com/settings/project',
    description: 'Product analytics',
  },
  twilio: {
    name: 'Twilio',
    envVars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'],
    category: 'api_keys',
    setupUrl: 'https://console.twilio.com',
    description: 'Communication APIs (SMS, Voice)',
  },
  github: {
    name: 'GitHub',
    envVars: ['GITHUB_TOKEN', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'],
    category: 'authentication',
    setupUrl: 'https://github.com/settings/tokens',
    description: 'GitHub API access',
  },
  google: {
    name: 'Google Cloud',
    envVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_API_KEY'],
    category: 'api_keys',
    setupUrl: 'https://console.cloud.google.com/apis/credentials',
    description: 'Google Cloud Platform services',
  },
}

// Category metadata
export const CATEGORY_INFO: Record<EnvCategory, { label: string; description: string; icon: string }> = {
  database: {
    label: 'Database',
    description: 'Database connections and credentials',
    icon: '🗄️',
  },
  authentication: {
    label: 'Authentication',
    description: 'Authentication providers and secrets',
    icon: '🔐',
  },
  api_keys: {
    label: 'API Keys',
    description: 'Third-party API keys and tokens',
    icon: '🔑',
  },
  storage: {
    label: 'Storage',
    description: 'File storage and CDN services',
    icon: '📦',
  },
  email: {
    label: 'Email',
    description: 'Email service providers',
    icon: '📧',
  },
  analytics: {
    label: 'Analytics',
    description: 'Analytics and monitoring tools',
    icon: '📊',
  },
  payment: {
    label: 'Payment',
    description: 'Payment processing services',
    icon: '💳',
  },
  other: {
    label: 'Other',
    description: 'Other configuration variables',
    icon: '⚙️',
  },
}

// Detect environment variables from file content
export function detectEnvVarsFromContent(content: string): string[] {
  const envVars = new Set<string>()

  // Match process.env.VAR_NAME patterns
  const processEnvMatches = content.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)
  for (const match of processEnvMatches) {
    envVars.add(match[1])
  }

  // Match process.env['VAR_NAME'] or process.env["VAR_NAME"]
  const processEnvBracketMatches = content.matchAll(/process\.env\[['"]([A-Z][A-Z0-9_]*)['"]\]/g)
  for (const match of processEnvBracketMatches) {
    envVars.add(match[1])
  }

  // Match import.meta.env.VAR_NAME (Vite)
  const importMetaMatches = content.matchAll(/import\.meta\.env\.([A-Z][A-Z0-9_]*)/g)
  for (const match of importMetaMatches) {
    envVars.add(match[1])
  }

  // Match NEXT_PUBLIC_ variables in templates
  const nextPublicMatches = content.matchAll(/\{?\s*(NEXT_PUBLIC_[A-Z][A-Z0-9_]*)\s*\}?/g)
  for (const match of nextPublicMatches) {
    envVars.add(match[1])
  }

  return Array.from(envVars)
}

// Parse .env file content
export function parseEnvFile(content: string): Record<string, string> {
  const envVars: Record<string, string> = {}
  const lines = content.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue

    const key = trimmed.substring(0, eqIndex).trim()
    let value = trimmed.substring(eqIndex + 1).trim()

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    if (key) {
      envVars[key] = value
    }
  }

  return envVars
}

// Detect service from environment variable
function detectServiceFromEnvVar(envVarKey: string): DetectedService | undefined {
  for (const [, service] of Object.entries(SERVICE_PATTERNS)) {
    if (service.envVars.some(v => v === envVarKey || envVarKey.includes(v.replace('NEXT_PUBLIC_', '')))) {
      return service
    }
  }
  return undefined
}

// Get category from environment variable
function getCategoryFromEnvVar(envVarKey: string): EnvCategory {
  const service = detectServiceFromEnvVar(envVarKey)
  if (service) return service.category

  // Fallback category detection
  const key = envVarKey.toUpperCase()
  if (key.includes('DATABASE') || key.includes('DB_') || key.includes('MONGO') || key.includes('POSTGRES') || key.includes('REDIS')) {
    return 'database'
  }
  if (key.includes('AUTH') || key.includes('SECRET') || key.includes('JWT') || key.includes('SESSION')) {
    return 'authentication'
  }
  if (key.includes('API_KEY') || key.includes('TOKEN') || key.includes('_KEY')) {
    return 'api_keys'
  }
  if (key.includes('S3') || key.includes('STORAGE') || key.includes('BUCKET') || key.includes('CDN')) {
    return 'storage'
  }
  if (key.includes('EMAIL') || key.includes('SMTP') || key.includes('MAIL')) {
    return 'email'
  }
  if (key.includes('ANALYTICS') || key.includes('TRACKING') || key.includes('SENTRY')) {
    return 'analytics'
  }
  if (key.includes('STRIPE') || key.includes('PAYMENT') || key.includes('PAYPAL')) {
    return 'payment'
  }

  return 'other'
}

// Main function to analyze project files and detect environment variables
export function analyzeProject(files: ProjectFile[]): EnvVariable[] {
  const detectedVars = new Map<string, EnvVariable>()

  for (const file of files) {
    // Skip binary files, node_modules, etc.
    if (file.path.includes('node_modules') ||
        file.path.includes('.git') ||
        !file.content) {
      continue
    }

    // Check for .env files
    if (file.name.startsWith('.env')) {
      const envContent = parseEnvFile(file.content)
      for (const [key, value] of Object.entries(envContent)) {
        if (!detectedVars.has(key)) {
          const service = detectServiceFromEnvVar(key)
          const category = getCategoryFromEnvVar(key)

          detectedVars.set(key, {
            id: `env-${key}`,
            key,
            value: value || '',
            category,
            description: service?.description || `Configure ${key}`,
            required: !key.startsWith('NEXT_PUBLIC_') && !value,
            detected: true,
            service: service ? {
              name: service.name,
              docUrl: service.setupUrl,
              signupUrl: service.setupUrl,
              description: service.description,
            } : undefined,
          })
        }
      }
    }

    // Scan code files for env var usage
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']
    if (extensions.some(ext => file.name.endsWith(ext))) {
      const foundVars = detectEnvVarsFromContent(file.content)

      for (const key of foundVars) {
        if (!detectedVars.has(key)) {
          const service = detectServiceFromEnvVar(key)
          const category = getCategoryFromEnvVar(key)

          detectedVars.set(key, {
            id: `env-${key}`,
            key,
            value: '',
            category,
            description: service?.description || `Configure ${key}`,
            required: !key.startsWith('NEXT_PUBLIC_'),
            detected: true,
            service: service ? {
              name: service.name,
              docUrl: service.setupUrl,
              signupUrl: service.setupUrl,
              description: service.description,
            } : undefined,
          })
        }
      }
    }
  }

  // Sort by category and required status
  return Array.from(detectedVars.values()).sort((a, b) => {
    if (a.required !== b.required) return a.required ? -1 : 1
    return a.category.localeCompare(b.category)
  })
}

// Get detected services summary
export function getDetectedServices(envVars: EnvVariable[]): DetectedService[] {
  const services = new Map<string, DetectedService>()

  for (const envVar of envVars) {
    for (const [key, service] of Object.entries(SERVICE_PATTERNS)) {
      if (service.envVars.includes(envVar.key)) {
        if (!services.has(key)) {
          services.set(key, service)
        }
      }
    }
  }

  return Array.from(services.values())
}

// Group environment variables by category
export function groupByCategory(envVars: EnvVariable[]): Record<EnvCategory, EnvVariable[]> {
  const groups: Record<EnvCategory, EnvVariable[]> = {
    database: [],
    authentication: [],
    api_keys: [],
    storage: [],
    email: [],
    analytics: [],
    payment: [],
    other: [],
  }

  for (const envVar of envVars) {
    groups[envVar.category].push(envVar)
  }

  return groups
}

// Validate environment variables
export function validateEnvVars(envVars: EnvVariable[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const envVar of envVars) {
    if (envVar.required && !envVar.value) {
      errors.push(`${envVar.key} is required but not set`)
    }

    // Validate URL formats
    if (envVar.key.includes('URL') && envVar.value) {
      try {
        new URL(envVar.value)
      } catch {
        errors.push(`${envVar.key} must be a valid URL`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
