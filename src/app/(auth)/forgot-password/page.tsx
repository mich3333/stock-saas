'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { TrendingUp } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Valid email required'),
})

type Form = z.infer<typeof schema>

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
]

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: Form) => {
    setLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gray-950">
      <motion.div
        animate={{
          background: [
            'radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.1) 0%, transparent 60%)',
            'radial-gradient(ellipse at 60% 80%, rgba(59,130,246,0.15) 0%, transparent 60%), radial-gradient(ellipse at 30% 10%, rgba(139,92,246,0.1) 0%, transparent 60%)',
            'radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.1) 0%, transparent 60%)',
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0"
      />

      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-blue-500/20"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -30, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

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

        {sent ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold mb-2 text-white">Check your email</h1>
            <p className="text-gray-400 mb-6">
              We sent a password reset link to your email address. Check your inbox and follow the instructions.
            </p>
            <Link
              href="/login"
              className="block text-center text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Back to Sign In
            </Link>
          </motion.div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2 text-white">Forgot your password?</h1>
            <p className="text-gray-400 mb-6">Enter your email and we&apos;ll send you a reset link.</p>

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
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500"
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" loading={loading} disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Remember your password?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  )
}
