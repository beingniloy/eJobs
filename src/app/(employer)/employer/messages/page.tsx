"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useThemeStore } from "@/store/theme-store";
import { messagesService } from "@/services/messages.service";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import type { Conversation } from "@/types";

export default function EmployerMessagesPage() {
  const { language } = useThemeStore();
  const isBn = language === "bn";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    messagesService
      .getConversations()
      .then((res) => setConversations(res || []))
      .catch(() => { /* handled */ })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isBn ? "বার্তা" : "Messages"}</h1>
        <p className="text-muted-foreground mt-1">
          {isBn ? "আপনার কথোপকথন" : "Your conversations with candidates"}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : !conversations.length ? (
        <div className="text-center py-16">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {isBn ? "কোনো বার্তা নেই" : "No messages yet"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isBn ? "প্রার্থীদের সাথে কথোপকথন শুরু করুন" : "Start a conversation with candidates"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link key={conv.id} href={`/employer/messages/${conv.uuid}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <DefaultAvatar src={conv.participant?.avatar} name={conv.participant?.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{conv.participant?.name}</p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {conv.last_message?.created_at && formatRelativeTime(conv.last_message.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.last_message?.body || (isBn ? "কোনো বার্তা নেই" : "No messages")}
                    </p>
                  </div>
                  {(conv.unread_count ?? 0) > 0 && (
                    <Badge variant="destructive" className="shrink-0 text-[10px] px-1.5 py-0">
                      {conv.unread_count}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
