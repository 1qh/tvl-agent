import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export const useNavigateToHome = () => {
  const router = useRouter()
  return useCallback(() => {
    router.push('/')
    router.refresh()
  }, [router])
}
