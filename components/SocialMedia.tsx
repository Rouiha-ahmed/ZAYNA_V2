import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Music2,
  Globe,
  type LucideIcon,
} from "lucide-react";
import React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { StorefrontSocialLink } from '@/lib/storefront';

const iconByPlatform: Record<string, LucideIcon> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: Music2,
};

interface props{
    className?: string;
    iconClassName?: string;
    tooltipClassName?: string;
    links?: StorefrontSocialLink[];
}

const SocialMedia = ({ className, iconClassName, tooltipClassName, links = [] }: props) => {
  const fallbackLinks: StorefrontSocialLink[] = [
    {
      id: "fallback-facebook",
      platform: "facebook",
      title: "Facebook",
      href: "https://www.facebook.com/",
      sortOrder: 0,
      openInNewTab: true,
    },
    {
      id: "fallback-instagram",
      platform: "instagram",
      title: "Instagram",
      href: "https://www.instagram.com/",
      sortOrder: 1,
      openInNewTab: true,
    },
    {
      id: "fallback-twitter",
      platform: "twitter",
      title: "Twitter",
      href: "https://www.twitter.com/",
      sortOrder: 2,
      openInNewTab: true,
    },
  ];

  const activeLinks = links.length > 0 ? links : fallbackLinks;

  const normalizedLinks = activeLinks
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      ...item,
      icon: iconByPlatform[item.platform.toLowerCase()] || Globe,
    }));

  return (
    <TooltipProvider>
        <div className={cn("flex items-center gap-3.5", className)}>
            {normalizedLinks?.map((item) => {
                const Icon = item.icon;

                return (
                <Tooltip key={item?.title}>
                    <TooltipTrigger asChild>
                        <Link
                          href={item?.href}
                          key={item?.title}
                          target={item.openInNewTab ? "_blank" : undefined}
                          rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                          className={cn("p-2 border rounded-full hover:text-white hover:border-shop_light_green hoverEffect", iconClassName)}
                        >
                            <Icon className='w-5 h-5' />
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent className={cn("bg-white text-darkColor font-semibold", tooltipClassName)}>
                        {item?.title}
                    </TooltipContent>
                </Tooltip>
            )})}
        </div>
    </TooltipProvider>
  )
}

export default SocialMedia
