"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShieldAlert, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface NavItem {
    name: string;
    href: string;
    icon: React.ElementType;
}

interface MobileMenuProps {
    navItems: NavItem[];
}

export function MobileMenu({ navItems }: MobileMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <div className="md:hidden">
            {/* Header Bar */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-[#00695C] text-white flex items-center justify-between px-4 z-40 shadow-md">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="h-6 w-6" />
                    <span className="font-bold text-lg">RSEMS Clinician</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMenu}
                    className="text-white hover:bg-white/10 px-2"
                >
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
            </div>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar / Menu Content */}
            <div className={cn(
                "fixed inset-y-0 left-0 w-64 bg-[#00695C] text-white z-50 transform transition-transform duration-300 ease-in-out shadow-xl",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h1 className="font-bold text-lg leading-tight">RSEMS</h1>
                        <span className="text-xs text-white/70 uppercase tracking-wider">Clinician Portal</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-white/10 text-white"
                                        : "text-white/70 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10 absolute bottom-0 w-full mb-16">
                    <Link
                        href="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        Exit to App
                    </Link>
                </div>
            </div>

            {/* Spacer to push content down below fixed header */}
            <div className="h-16" />
        </div>
    );
}
