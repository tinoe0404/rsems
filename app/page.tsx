"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Heart, Shield, Users } from "lucide-react";

export default function Home() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-screen flex-col items-center justify-center py-12">
          {/* Logo/Brand Area */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary/10 p-4">
              <Heart className="h-12 w-12 text-primary" strokeWidth={2} />
            </div>
            <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Welcome to{" "}
              <span className="text-primary">RSEMS</span>
            </h1>
            <p className="text-lg text-muted sm:text-xl">
              Radiotherapy Side Effect Electronic Monitoring System
            </p>
          </div>

          {/* Description */}
          <div className="mb-12 max-w-2xl text-center">
            <p className="text-base leading-relaxed text-foreground sm:text-lg">
              A compassionate digital platform designed to support cancer patients
              in Zimbabwe throughout their radiotherapy journey. Monitor your
              treatment progress, communicate with your care team, and receive
              personalized support every step of the way.
            </p>
          </div>

          {/* Login Buttons */}
          <div className="mb-16 flex flex-col gap-4 sm:flex-row sm:gap-6">
            <Button
              size="lg"
              variant="primary"
              className="w-full sm:w-auto"
              onClick={() => router.push("/login")}
            >
              <Users className="mr-2 h-5 w-5" />
              Patient Login
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => router.push("/admin/login")}
            >
              <Shield className="mr-2 h-5 w-5" />
              Clinician Login
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid w-full max-w-4xl gap-6 sm:grid-cols-3">
            <Card hover padding="lg" className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="mb-2 font-semibold text-foreground">
                Patient-Centered Care
              </h3>
              <p className="text-sm text-muted">
                Monitor symptoms and communicate directly with your healthcare team
              </p>
            </Card>

            <Card hover padding="lg" className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-success/10 p-3">
                  <Shield className="h-6 w-6 text-success" />
                </div>
              </div>
              <h3 className="mb-2 font-semibold text-foreground">
                Secure & Private
              </h3>
              <p className="text-sm text-muted">
                Your medical data is protected with industry-leading security
              </p>
            </Card>

            <Card hover padding="lg" className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-info/10 p-3">
                  <Users className="h-6 w-6 text-info" />
                </div>
              </div>
              <h3 className="mb-2 font-semibold text-foreground">
                Expert Support
              </h3>
              <p className="text-sm text-muted">
                Access to qualified clinicians dedicated to your wellbeing
              </p>
            </Card>
          </div>

          {/* Footer */}
          <footer className="mt-16 text-center">
            <p className="text-sm text-muted">
              Made with care for cancer patients in Zimbabwe
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

