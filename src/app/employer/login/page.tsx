import type { Metadata } from "next";
import EmployerLoginClient from "@/app/(auth)/employer-login/EmployerLoginClient";

const siteName = process.env.NEXT_PUBLIC_APP_NAME || "eJobs";

export const metadata: Metadata = {
  title: "Employer Login",
  description: `Login to your employer account on ${siteName}.`,
};

export default function EmployerLoginPage() {
  return <EmployerLoginClient />;
}
