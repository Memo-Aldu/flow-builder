import { Loader2 } from 'lucide-react'
import React from 'react'

export const AppLoading = () => {
  return (
    <div className='flex h-screen w-full items-center justify-center'>
       <Loader2 size={30} className='animate-spin stroke-primary' /> 
    </div>
  )
}
