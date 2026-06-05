import { NavBar } from "@/components/NavBar";
import { Ticket } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background transition-smooth">
      <NavBar />

      <main className="flex-1 bg-background">{children}</main>

      <footer
        className="bg-card border-t border-border mt-auto"
        data-ocid="footer"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
                <Ticket className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-foreground">
                AssignServiceHub
              </span>
            </div>

            {/* Tagline */}
            <p className="text-muted-foreground text-sm text-center">
              Written by Experts, Trusted by Students
            </p>

            {/* Legal */}
            <p className="text-muted-foreground text-xs text-center">
              © 2026 AssignServiceHub. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
