"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api-client";
import PublicLayout from "@/components/layout/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, CheckCircle, Briefcase } from "lucide-react";
import { useThemeStore } from "@/store/theme-store";

export default function GuestJobPostClient() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name_en: string; name_bn: string }[]>([]);
  const [availability, setAvailability] = useState({ enabled: true, max_jobs: 3, requires_review: true });
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const { settings } = useThemeStore();
  const siteName = settings.site_name || process.env.NEXT_PUBLIC_APP_NAME || "eJobs";

  // Form state
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [jobType, setJobType] = useState("full-time");
  const [vacancies, setVacancies] = useState("1");
  const [location, setLocation] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    document.title = `Post a Job (Guest) | ${siteName}`;

    api.get("/categories")
      .then((res) => setCategories(res.data?.data || res.data || []))
      .catch(() => {});

    api.get("/guest-jobs/availability")
      .then((res) => setAvailability(res.data?.data || { enabled: true, max_jobs: 3, requires_review: true }))
      .catch(() => {})
      .finally(() => setLoadingAvailability(false));
  }, [siteName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !categoryId || !location || !description || !contactEmail || !deadline) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (description.length < 50) {
      toast.error("Description must be at least 50 characters");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/guest-jobs", {
        title,
        category_id: categoryId,
        job_type: jobType,
        vacancies: parseInt(vacancies) || 1,
        location,
        salary_range: salaryRange,
        deadline,
        description,
        contact_email: contactEmail,
        contact_person_name: contactName,
        contact_phone: contactPhone,
      });
      setSubmitted(true);
      toast.success("Job posted successfully!");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to post job. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingAvailability) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </div>
      </PublicLayout>
    );
  }

  if (!availability.enabled) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <Card>
            <CardContent className="p-12">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h1 className="text-2xl font-bold mb-2">Guest Job Posting Disabled</h1>
              <p className="text-muted-foreground">
                Guest job posting is currently disabled. Please create an account to post jobs.
              </p>
              <Button className="mt-6" onClick={() => window.location.href = "/register"}>
                Create Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  if (submitted) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <Card>
            <CardContent className="p-12">
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Job Posted Successfully!</h1>
              <p className="text-muted-foreground mb-6">
                {availability.requires_review
                  ? "Your job has been submitted for review. It will be visible once approved by an admin."
                  : "Your job is now live and visible to candidates."}
              </p>
              <Button onClick={() => window.location.href = "/jobs"}>
                Browse Jobs
              </Button>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Post a Job (Guest)</h1>
            <p className="text-muted-foreground">
              Post a job without an account. Max {availability.max_jobs} posts per email.
              {availability.requires_review && " Posts require admin review before going live."}
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Job Title */}
                <div className="space-y-2">
                  <Label>Job Title *</Label>
                  <Input placeholder="e.g. Senior Software Engineer" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                {/* Category & Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name_en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Job Type *</Label>
                    <Select value={jobType} onValueChange={setJobType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full Time</SelectItem>
                        <SelectItem value="part-time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Vacancies & Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vacancies</Label>
                    <Input type="number" min="1" value={vacancies} onChange={(e) => setVacancies(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Location *</Label>
                    <Input placeholder="e.g. Dhaka, Bangladesh" value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                </div>

                {/* Salary & Deadline */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Salary Range</Label>
                    <Input placeholder="e.g. 30,000 - 50,000 BDT" value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Deadline *</Label>
                    <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Job Description * (min 50 characters)</Label>
                  <Textarea
                    rows={8}
                    placeholder="Describe the role, responsibilities, requirements..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{description.length} characters</p>
                </div>

                {/* Contact Info */}
                <div className="border-t pt-5 space-y-4">
                  <h3 className="font-semibold">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contact Email *</Label>
                      <Input type="email" placeholder="your@email.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Name</Label>
                      <Input placeholder="Your name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input placeholder="+880 1XXX-XXXXXX" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting...</>
                  ) : (
                    "Post Job"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
