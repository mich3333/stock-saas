import '@testing-library/jest-dom'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: jest.fn(),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ getAll: () => [], get: () => null, set: jest.fn() })),
  headers: jest.fn(() => new Map()),
}))
