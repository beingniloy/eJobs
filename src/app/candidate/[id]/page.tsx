import PublicProfileClient from "@/app/profile/[username]/PublicProfileClient";

export default function CandidateProfileByIdPage({ params }: { params: { id: string } }) {
  return <PublicProfileClient username={params.id} />;
}
