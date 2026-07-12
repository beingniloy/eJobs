import GuestJobPostClient from "./GuestJobPostClient";

const siteName = process.env.NEXT_PUBLIC_APP_NAME || "eJobs";

export const metadata = {
  title: `Post a Job (Guest) | ${siteName}`,
  description: `Post a job without an account on ${siteName}.`,
};

export default function GuestJobPostPage() {
  return <GuestJobPostClient />;
}
