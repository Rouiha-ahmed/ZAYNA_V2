import { Facebook, Instagram, Twitter } from 'lucide-react'
import React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { cn } from '@/lib/utils';
import Link from 'next/link';

const socialLink = [
    {
        title: "Facebook",
        href: "https://www.facebook.com/",
        icon: <Facebook className='w-5 h-5' />,
    },
    {
        title: "Instagram",
        href: "https://www.instagram.com/",
        icon: <Instagram className='w-5 h-5' />,
    },
    {
        title: "Twitter",
        href: "https://www.twitter.com/",
        icon: <Twitter className='w-5 h-5' />,
    },
];
interface props{
    className?: string;
    iconClassName?: string;
    tooltipClassName?: string;
}

const SocialMedia = ({ className, iconClassName, tooltipClassName }: props) => {
  return (
    <TooltipProvider>
        <div className={cn("flex items-center gap-3.5", className)}>
            {socialLink?.map((item) =>(
                <Tooltip key={item?.title}>
                    <TooltipTrigger asChild>
                        <Link href={item?.href} key={item?.title} target='_blank' rel='noopener noreferrer' className={cn("p-2 border rounded-full hover:text-white hover:border-shop_light_green hoverEffect", iconClassName)}>
                            {item?.icon}
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent className={cn("bg-white text-darkColor font-semibold", tooltipClassName)}>
                        {item?.title}
                    </TooltipContent>
                </Tooltip>
            ))}
        </div>
    </TooltipProvider>
  )
}

export default SocialMedia