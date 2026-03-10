'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { TrendingUp } from 'lucide-react'

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Valid email required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

const PARTICLES = [
  { id: 0,  x: 74.7, y: 86.3, size: 3.0, duration: 12, delay: 0.0 },
  { id: 1,  x: 95.2, y: 11.1, size: 2.9, duration: 10, delay: 1.2 },
  { id: 2,  x: 76.0, y: 80.5, size: 4.2, duration: 14, delay: 2.1 },
  { id: 3,  x: 19.0, y: 74.3, size: 5.9, duration: 11, delay: 0.5 },
  { id: 4,  x: 8.4,  y: 75.4, size: 5.4, duration: 13, delay: 3.0 },
  { id: 5,  x: 76.6, y: 91.8, size: 5.0, duration: 9,  delay: 1.8 },
  { id: 6,  x: 57.8, y: 35.3, size: 5.4, duration: 12, delay: 0.3 },
  { id: 7,  x: 74.8, y: 97.6, size: 3.3, duration: 10, delay: 2.7 },
  { id: 8,  x: 96.7, y: 39.4, size: 5.7, duration: 11, delay: 1.5 },
  { id: 9,  x: 62.8, y: 27.7, size: 4.1, duration: 13, delay: 0.9 },
  { id: 10, x: 76.8, y: 31.1, size: 4.3, duration: 8,  delay: 3.5 },
  { id: 11, x: 3.0,  y: 35.0, size: 4.7, duration: 14, delay: 0.7 },
  { id: 12, x: 12.7, y: 34.0, size: 2.7, duration: 10, delay: 2.3 },
  { id: 13, x: 47.8, y: 99.4, size: 5.3, duration: 12, delay: 1.1 },
  { id: 14, x: 52.1, y: 64.7, size: 3.9, duration: 9,  delay: 0.4 },
  { id: 15, x: 6.8,  y: 2.7,  size: 2.6, duration: 11, delay: 2.8 },
  { id: 16, x: 22.2, y: 75.9, size: 5.6, duration: 13, delay: 1.6 },
  { id: 17, x: 97.3, y: 66.7, size: 5.0, duration: 8,  delay: 3.2 },
  { id: 18, x: 19.2, y: 34.8, size: 2.4, duration: 10, delay: 0.6 },
  { id: 19, x: 21.0, y: 55.9, size: 5.0, duration: 12, delay: 1.9 },
]

const inputClass =
  'w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    setLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (authError) {
      setError(authError.message)
      setLoading(false)
    }
  }

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.fullName },
      },
    })
    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gray-950">
      {/* Animated gradient background */}
      <motion.div
        animate={{
          background: [
            'radial-gradient(ellipse at 80% 50%, rgba(59,130,246,0.15) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(139,92,246,0.1) 0%, transparent 60%)',
            'radial-gradient(ellipse at 40% 20%, rgba(59,130,246,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(139,92,246,0.1) 0%, transparent 60%)',
            'radial-gradient(ellipse at 80% 50%, rgba(59,130,246,0.15) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(139,92,246,0.1) 0%, transparent 60%)',
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0"
      />

      {/* Floating particles */}
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-blue-500/20"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -30, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 bg-white/5 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/10"
      >
        <Link href="/" className="flex items-center gap-2 mb-8">
          <TrendingUp className="text-blue-400" size={24} />
          <span className="font-bold text-xl text-white">StockFlow</span>
        </Link>

        <h1 className="text-2xl font-bold mb-2 text-white">Create your account</h1>
        <p className="text-gray-400 mb-6">Start tracking stocks for free</p>

        {/* OAuth buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => signInWithOAuth('google')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button
            onClick={() => signInWithOAuth('github')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Continue with GitHub
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-gray-500">or continue with email</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {[
            { label: 'Full Name', field: 'fullName' as const, type: 'text', placeholder: 'John Doe', error: errors.fullName },
            { label: 'Email', field: 'email' as const, type: 'email', placeholder: 'you@example.com', error: errors.email },
            { label: 'Password', field: 'password' as const, type: 'password', placeholder: '••••••••', error: errors.password },
            { label: 'Confirm Password', field: 'confirmPassword' as const, type: 'password', placeholder: '••••••••', error: errors.confirmPassword },
          ].map(({ label, field, type, placeholder, error: fieldError }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
              <input {...register(field)} type={type} className={inputClass} placeholder={placeholder} />
              {fieldError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-1"
                >
                  {fieldError.message}
                </motion.p>
              )}
            </div>
          ))}

          <Button type="submit" className="w-full" loading={loading} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
