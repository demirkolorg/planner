import { LoginForm } from "@/components/auth/login-form";
import { ModeToggle } from "@/components/theme/mode-toggle";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
      {/* <BackgroundBeams /> */}
    </div>
  );
}
