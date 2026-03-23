import { cn } from '@/lib/utils'
import React from 'react'

type ContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

const Container = ({ children, className, ...props }: ContainerProps) => {
  return (
    <div className={cn("mx-auto w-full max-w-[1300px] px-4 md:px-6", className)} {...props}>
      {children}
    </div>
  )
}


export default Container
