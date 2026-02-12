import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { PrimeReactProvider } from 'primereact/api'

import './index.css'
import { router } from './routes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

const primeReactConfig = {
  ripple: true,
  inputStyle: 'outlined' as const,
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrimeReactProvider value={primeReactConfig}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </PrimeReactProvider>
  </StrictMode>,
)
