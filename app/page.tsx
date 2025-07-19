import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";

export default async function Home() {
  // Check if user is authenticated and redirect to dashboard
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"} className="flex items-center gap-2">
                <span className="text-2xl">🎓</span>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-xl font-bold">
                  Budi
                </span>
              </Link>
            </div>
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Meet Budi
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                Your AI-powered study companion for university success
              </p>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get personalized study plans, smart note summaries, schedule management, and intelligent tutoring - all in one place.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/sign-up">
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                  Get Started Free
                </button>
              </Link>
              <Link href="/auth/login">
                <button className="border border-gray-300 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                  Sign In
                </button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="font-semibold">AI Chat Assistant</h3>
              <p className="text-sm text-muted-foreground">
                Get instant answers to academic questions and study guidance
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="font-semibold">Smart Note Summary</h3>
              <p className="text-sm text-muted-foreground">
                Upload documents and get AI-powered summaries and flashcards
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="font-semibold">Schedule Management</h3>
              <p className="text-sm text-muted-foreground">
                Organize classes, deadlines, and get intelligent reminders
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="font-semibold">Study Plans</h3>
              <p className="text-sm text-muted-foreground">
                Get personalized study schedules based on your exams and goals
              </p>
            </div>
          </div>

          {hasEnvVars ? null : (
            <main className="flex-1 flex flex-col gap-6 px-4">
              <div className="text-center">
                <h2 className="font-medium text-xl mb-4">Get Started</h2>
                <p className="text-muted-foreground mb-4">
                  To use Budi, you&apos;ll need to set up your Supabase environment variables first.
                </p>
                <p className="text-sm text-muted-foreground">
                  Create a <code className="bg-muted px-2 py-1 rounded">.env.local</code> file and add your Supabase credentials.
                </p>
              </div>
            </main>
          )}
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
