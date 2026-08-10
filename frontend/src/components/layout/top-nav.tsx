"use client";

import { Bell, Menu, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

// Top navigation providing search, notifications, and user profile placeholder
export function TopNav() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b glass-panel px-4 sm:px-6">
      {/* Mobile menu trigger */}
      <Button variant="ghost" size="icon" className="md:hidden">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle Menu</span>
      </Button>

      {/* Page Title - hidden on small screens if space is tight */}
      <div className="hidden sm:flex items-center gap-2 text-lg font-semibold md:text-xl">
        <span>Dashboard</span>
      </div>

      <div className="flex flex-1 items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
        {/* Search Placeholder */}
        <form className="ml-auto flex-1 sm:flex-initial hidden sm:flex relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search students, subjects..."
            className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-background/50"
          />
        </form>

        {/* Notifications */}
        <NotificationDropdown />

        {/* User Profile Placeholder */}
        <Button variant="outline" size="icon" className="rounded-full overflow-hidden neo-border">
          <User className="h-5 w-5" />
          <span className="sr-only">User Menu</span>
        </Button>
      </div>
    </header>
  );
}
