import type { Metadata } from "next";
import dynamic from "next/dynamic";

const AiAssistantClient = dynamic(() => import("./AiAssistantClient"), { ssr: false });

export const metadata: Metadata = {
  title: "AI Assistant",
  description: "Chat with our AI career assistant for personalized guidance and job recommendations.",
};

export default function AiAssistantPage() {
  return <AiAssistantClient />;
}
