"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import api from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Download, Search, Users, Filter } from "lucide-react";

interface Candidate {
  id: number;
  name: string;
  email: string;
  profile: {
    phone: string | null;
    location: string | null;
    skills: string[] | string | null;
    years_of_experience: number | null;
    highest_education: string | null;
    current_position: string | null;
  } | null;
}

export default function CvDatabaseClient() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");
  const [expMin, setExpMin] = useState("");
  const [expMax, setExpMax] = useState("");

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    if (user) fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && !authLoading) fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, skills, location, expMin, expMax]);

  const fetchCandidates = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (skills) params.skills = skills;
    if (location) params.location = location;
    if (expMin) params.experience_min = expMin;
    if (expMax) params.experience_max = expMax;

    api.get("/cv-database/search", { params })
      .then((res) => setCandidates(res.data?.data?.data || []))
      .catch(() => toast.error("Failed to load candidates"))
      .finally(() => setLoading(false));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (skills) params.set("skills", skills);
      if (location) params.set("location", location);
      if (expMin) params.set("experience_min", expMin);
      if (expMax) params.set("experience_max", expMax);

      const response = await api.get(`/cv-database/export?${params.toString()}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `cv_database_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("CV database exported successfully!");
    } catch {
      toast.error("Failed to export. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const formatSkills = (skills: string[] | string | null | undefined): string[] => {
    if (!skills) return [];
    if (Array.isArray(skills)) return skills.slice(0, 5);
    return skills.split(",").map((s) => s.trim()).slice(0, 5);
  };

  if (authLoading || loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CV Database</h1>
          <p className="text-muted-foreground">Search and download candidate CVs in bulk</p>
        </div>
        <Button onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search name/skills..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Input placeholder="Skills (e.g. React)" value={skills} onChange={(e) => setSkills(e.target.value)} />
            <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
            <Input type="number" placeholder="Min experience" value={expMin} onChange={(e) => setExpMin(e.target.value)} />
            <Input type="number" placeholder="Max experience" value={expMax} onChange={(e) => setExpMax(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="text-sm text-muted-foreground mb-2">
        <Users className="h-4 w-4 inline mr-1" />
        {candidates.length} candidates found
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {candidates.map((candidate) => (
          <Card key={candidate.id}>
            <CardContent className="p-4">
              <h3 className="font-semibold">{candidate.name}</h3>
              <p className="text-sm text-muted-foreground">{candidate.email}</p>
              {candidate.profile?.current_position && (
                <p className="text-sm mt-1">{candidate.profile.current_position}</p>
              )}
              <div className="flex flex-wrap gap-1 mt-2">
                {formatSkills(candidate.profile?.skills).map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                {candidate.profile?.location && <span>{candidate.profile.location}</span>}
                {candidate.profile?.years_of_experience != null && <span>{candidate.profile.years_of_experience}yr exp</span>}
                {candidate.profile?.highest_education && <span>{candidate.profile.highest_education}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {candidates.length === 0 && (
        <div className="text-center py-16">
          <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No candidates match your filters. Try adjusting your search.</p>
        </div>
      )}
    </div>
  );
}
