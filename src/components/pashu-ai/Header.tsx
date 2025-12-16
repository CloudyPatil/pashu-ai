"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CowIcon } from './icons';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { Language } from '@/lib/translations';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme-toggle';
import { BrainCircuit, Scan, Home, HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils';


type HeaderProps = {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  mode: 'online' | 'offline';
  onModeChange: (mode: 'online' | 'offline') => void;
  appName: string;
  tagline: string;
  onlineText: string;
  offlineText: string;
};

export default function Header({
  language,
  onLanguageChange,
  mode,
  onModeChange,
  appName,
  tagline,
  onlineText,
  offlineText,
}: HeaderProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/scanner', label: 'Scanner', icon: Scan },
    { href: '/decision-support', label: 'Decision Support', icon: BrainCircuit },
    { href: '/disease-detection', label: 'Disease Detection', icon: HeartPulse },
  ];


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-4">
          <CowIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold font-headline tracking-tight text-primary">
              {appName}
            </h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              {tagline}
            </p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-2 rounded-full border bg-muted p-1">
          {navItems.map((item) => (
            <Link href={item.href} key={item.href}>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "rounded-full gap-2",
                   pathname === item.href ? "shadow-sm" : ""
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>


        <div className="flex items-center gap-4">
          <ThemeToggle />
          {pathname === '/scanner' && (
            <div className="flex items-center space-x-2">
                <Label htmlFor="mode-switch" className="text-sm font-medium">
                {mode === 'online' ? onlineText : offlineText}
                </Label>
                <Switch
                id="mode-switch"
                checked={mode === 'online'}
                onCheckedChange={(checked) =>
                    onModeChange(checked ? 'online' : 'offline')
                }
                aria-label="Toggle online/offline mode"
                />
            </div>
          )}
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-1">
            <Button
              variant={language === 'en' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onLanguageChange('en')}
            >
              EN
            </Button>
            <Button
              variant={language === 'hi' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onLanguageChange('hi')}
            >
              HI
            </Button>
          </div>
        </div>
      </div>
      <div className="md:hidden flex justify-center border-t">
         <nav className="flex items-center gap-2 p-1 w-full container">
          {navItems.map((item) => (
            <Link href={item.href} key={item.href} className="flex-1">
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                size="sm"
                className="w-full gap-2"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
