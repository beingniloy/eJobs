import { redirect } from "next/navigation";

export const metadata = {
  title: "Login",
  description: "Sign in to your eJobs account.",
};

export default function EmployerLoginPage() {
  redirect("/login");
}
