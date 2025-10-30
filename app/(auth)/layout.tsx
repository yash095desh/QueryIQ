import React from 'react'

const layout = ({children}:{children:React.ReactNode}) => {
  return (
    <div className=' h-screen w-full flex justify-center py-16'>{children}</div>
  )
}

export default layout