"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api-client";
import { useThemeStore } from "@/store/theme-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { aiService } from "@/services/ai.service";
import { subscriptionService, type QuotaInfo } from "@/services/subscription.service";

const RichTextEditor = dynamic(() => import("@/components/ui/rich-text-editor"), { ssr: false });

const postJobSchema = z.object({
  // Section 1: Basic Job Information
  title: z.string().min(5, "Title must be at least 5 characters"),
  category_id: z.string().min(1, "Category is required"),
  job_type: z.string().min(1, "Job type is required"),
  vacancies: z.coerce.number().min(1, "At least 1 vacancy"),
  location: z.string().min(1, "Location is required"),
  workplace_type: z.string().optional(),
  salary_min: z.coerce.number().min(0).optional(),
  salary_max: z.coerce.number().min(0).optional(),
  salary_type: z.string().optional(),
  deadline: z.string().min(1, "Deadline is required"),

  // Section 2: Company Information
  contact_person_name: z.string().optional(),
  contact_email: z.string().email("Invalid email").optional().or(z.literal("")),
  contact_phone: z.string().optional(),

  // Section 3: Job Description
  description: z.string().min(50, "Description must be at least 50 characters"),
  job_summary: z.string().optional(),
  responsibilities: z.string().optional(),
  education_requirements: z.string().optional(),
  experience_requirements: z.string().optional(),
  experience_level: z.string().optional(),
  additional_requirements: z.string().optional(),
  benefits: z.string().optional(),
  required_skills: z.string().optional(),

  // Section 4: Candidate Requirements
  min_age: z.coerce.number().min(16).max(70).optional(),
  max_age: z.coerce.number().min(16).max(70).optional(),
  gender_preference: z.string().optional(),
  language_skills: z.string().optional(),
  required_certifications: z.string().optional(),
  driving_license_required: z.boolean().optional(),

  // Section 5: Application Information
  application_method: z.string().optional(),
  application_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  application_email: z.string().email("Invalid email").optional().or(z.literal("")),
  required_documents: z.array(z.string()).optional(),

  // Remote project
  is_remote_project: z.boolean().optional(),
  budget: z.coerce.number().min(0).optional(),
  budget_type: z.string().optional(),
});

type PostJobForm = z.input<typeof postJobSchema>;

export default function PostJobPage() {
  const router = useRouter();
  const { language, settings } = useThemeStore();
  const isBn = language === "bn";
  const siteName = settings.site_name || process.env.NEXT_PUBLIC_APP_NAME || "eJobs";
  const [submitting, setSubmitting] = useState(false);
  const [isRemoteProject, setIsRemoteProject] = useState(false);
  const [generatingJD, setGeneratingJD] = useState(false);
  const [aiQuota, setAiQuota] = useState<QuotaInfo | null>(null);
  const [categories, setCategories] = useState<{ id: string; name_en: string; name_bn: string }[]>([]);

  useEffect(() => {
    document.title = isBn ? `চাকরি পোস্ট করুন | ${siteName}` : `Post a Job | ${siteName}`;
  }, [isBn, siteName]);

  useEffect(() => {
    api.get("/categories").then((res) => {
      setCategories(res.data?.data || res.data || []);
    }).catch(() => { /* handled */ });
  }, []);

  useEffect(() => {
    subscriptionService.getMySubscriptionWithQuotas().then((res) => {
      setAiQuota(res.quotas?.job_description ?? null);
    }).catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PostJobForm>({
    resolver: zodResolver(postJobSchema),
    defaultValues: {
      vacancies: 1,
      workplace_type: "on-site",
      salary_type: "monthly",
      gender_preference: "any",
      application_method: "internal",
      required_documents: ["cv"],
      driving_license_required: false,
    },
  });

  const applicationMethod = watch("application_method");
  const requiredDocuments = watch("required_documents") || [];

  const toggleDocument = (doc: string) => {
    const current = requiredDocuments;
    if (current.includes(doc)) {
      setValue("required_documents", current.filter((d) => d !== doc), { shouldValidate: true });
    } else {
      setValue("required_documents", [...current, doc], { shouldValidate: true });
    }
  };

  const onSubmit = async (data: PostJobForm) => {
    try {
      setSubmitting(true);
      const salaryMin = data.salary_min || 0;
      const salaryMax = data.salary_max || 0;
      const payload: Record<string, any> = {
        ...data,
        salary_range: salaryMin && salaryMax ? `${salaryMin}-${salaryMax}` : salaryMin ? `${salaryMin}+` : undefined,
        is_remote_project: isRemoteProject,
      };
      delete payload.salary_min;
      delete payload.salary_max;

      await api.post("/employer/jobs", payload);
      toast.success(isBn ? "চাকরি সফলভাবে পোস্ট হয়েছে!" : "Job posted successfully!");
      router.push("/employer/manage-jobs");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to post job");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold">{isBn ? "নতুন চাকরি পোস্ট করুন" : "Post a New Job"}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

        {/* ════════════════════════════════════════════
            Section 0: Remote / Freelance Project Toggle
           ════════════════════════════════════════════ */}
        <Card className="border-dashed border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{isBn ? "রিমোট/ফ্রিল্যান্স প্রজেক্ট" : "Remote / Freelance Project"}</p>
                <p className="text-xs text-muted-foreground">
                  {isBn ? "এটি একটি রিমোট কাজ — বাজেট ও দক্ষতা নির্ধারণ করুন" : "Enable for remote work — set budget and required skills"}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isRemoteProject}
                  onChange={(e) => {
                    setIsRemoteProject(e.target.checked);
                    setValue("is_remote_project", e.target.checked);
                    if (e.target.checked) setValue("workplace_type", "remote");
                  }}
                />
                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2"></div>
              </label>
            </div>
            {isRemoteProject && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{isBn ? "বাজেট (BDT)" : "Budget (BDT)"}</Label>
                  <Input type="number" placeholder="15000" {...register("budget")} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isBn ? "বাজেটের ধরন" : "Budget Type"}</Label>
                  <Select onValueChange={(v) => setValue("budget_type", v)}>
                    <SelectTrigger><SelectValue placeholder={isBn ? "নির্বাচন করুন" : "Select type"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">{isBn ? "নির্ধারিত" : "Fixed Price"}</SelectItem>
                      <SelectItem value="hourly">{isBn ? "প্রতি ঘণ্টা" : "Hourly Rate"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ════════════════════════════════════════════
            Section 1: Basic Job Information
           ════════════════════════════════════════════ */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">
              {isBn ? "১. মৌলিক চাকরির তথ্য" : "1. Basic Job Information"}
            </h2>

            <div className="space-y-1.5">
              <Label>{isBn ? "পদের নাম" : "Job Title"} *</Label>
              <Input placeholder="e.g. Senior React Developer" {...register("title")} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{isBn ? "চাকরির ক্যাটাগরি" : "Job Category"} *</Label>
                <Select onValueChange={(v) => setValue("category_id", v)}>
                  <SelectTrigger><SelectValue placeholder={isBn ? "নির্বাচন করুন" : "Select category"} /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {isBn ? cat.name_bn : cat.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category_id && <p className="text-sm text-destructive">{errors.category_id.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>{isBn ? "চাকরির ধরন" : "Job Type"} *</Label>
                <Select onValueChange={(v) => setValue("job_type", v)}>
                  <SelectTrigger><SelectValue placeholder={isBn ? "নির্বাচন করুন" : "Select type"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">{isBn ? "ফুল-টাইম" : "Full-time"}</SelectItem>
                    <SelectItem value="part-time">{isBn ? "পার্ট-টাইম" : "Part-time"}</SelectItem>
                    <SelectItem value="contract">{isBn ? "চুক্তি" : "Contract"}</SelectItem>
                    <SelectItem value="internship">{isBn ? "ইন্টার্নশিপ" : "Internship"}</SelectItem>
                    <SelectItem value="freelance">{isBn ? "ফ্রিল্যান্স" : "Freelance"}</SelectItem>
                    <SelectItem value="remote">{isBn ? "রিমোট" : "Remote"}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.job_type && <p className="text-sm text-destructive">{errors.job_type.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{isBn ? "পদ সংখ্যা" : "Number of Vacancies"} *</Label>
                <Input type="number" min={1} {...register("vacancies")} />
                {errors.vacancies && <p className="text-sm text-destructive">{errors.vacancies.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>{isBn ? "চাকরির স্থান" : "Job Location"} *</Label>
                <Input placeholder="e.g. Dhaka, Bangladesh" {...register("location")} />
                {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{isBn ? "কর্মস্থলের ধরন" : "Workplace Type"}</Label>
                <Select value={watch("workplace_type") || "on-site"} onValueChange={(v) => setValue("workplace_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on-site">{isBn ? "অফিসে" : "On-site"}</SelectItem>
                    <SelectItem value="remote">{isBn ? "রিমোট" : "Remote"}</SelectItem>
                    <SelectItem value="hybrid">{isBn ? "হাইব্রিড" : "Hybrid"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>{isBn ? "অভিজ্ঞতা" : "Experience Level"}</Label>
                <Select onValueChange={(v) => setValue("experience_level", v)}>
                  <SelectTrigger><SelectValue placeholder={isBn ? "নির্বাচন করুন" : "Select level"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">{isBn ? "শুরুর পর্যায়" : "Entry Level"}</SelectItem>
                    <SelectItem value="mid">{isBn ? "মাঝারি পর্যায়" : "Mid Level"}</SelectItem>
                    <SelectItem value="senior">{isBn ? "সিনিয়র" : "Senior Level"}</SelectItem>
                    <SelectItem value="lead">{isBn ? "লিড" : "Lead"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>{isBn ? "সর্বনিম্ন বেতন (BDT)" : "Min Salary (BDT)"}</Label>
                <Input type="number" placeholder="25000" {...register("salary_min")} />
              </div>
              <div className="space-y-1.5">
                <Label>{isBn ? "সর্বোচ্চ বেতন (BDT)" : "Max Salary (BDT)"}</Label>
                <Input type="number" placeholder="50000" {...register("salary_max")} />
              </div>
              <div className="space-y-1.5">
                <Label>{isBn ? "বেতনের ধরন" : "Salary Type"}</Label>
                <Select value={watch("salary_type") || "monthly"} onValueChange={(v) => setValue("salary_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{isBn ? "মাসিক" : "Monthly"}</SelectItem>
                    <SelectItem value="hourly">{isBn ? "ঘণ্টাপ্রতি" : "Hourly"}</SelectItem>
                    <SelectItem value="negotiable">{isBn ? "আলোচনযোগ্য" : "Negotiable"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{isBn ? "শেষ তারিখ" : "Application Deadline"} *</Label>
              <Input type="date" {...register("deadline")} />
              {errors.deadline && <p className="text-sm text-destructive">{errors.deadline.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* ════════════════════════════════════════════
            Section 2: Company / Contact Information
           ════════════════════════════════════════════ */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">
              {isBn ? "২. কোম্পানি/যোগাযোগ তথ্য" : "2. Company / Contact Information"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{isBn ? "যোগাযোগকারীর নাম" : "Contact Person Name"}</Label>
                <Input placeholder="John Doe" {...register("contact_person_name")} />
              </div>
              <div className="space-y-1.5">
                <Label>{isBn ? "যোগাযোগ ইমেইল" : "Contact Email"}</Label>
                <Input type="email" placeholder="john@company.com" {...register("contact_email")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{isBn ? "যোগাযোগ ফোন" : "Contact Phone Number"}</Label>
              <Input placeholder="+880 1XXXXXXXXX" {...register("contact_phone")} />
            </div>
          </CardContent>
        </Card>

        {/* ════════════════════════════════════════════
            Section 3: Job Description
           ════════════════════════════════════════════ */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2 flex items-center justify-between">
              <span>{isBn ? "৩. চাকরির বিবরণ" : "3. Job Description"}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={generatingJD || (aiQuota != null && aiQuota.remaining <= 0)}
                onClick={async () => {
                  const title = watch("title");
                  if (!title || title.length < 5) {
                    toast.error(isBn ? "প্রথমে একটি চাকরির শিরোনাম লিখুন" : "Please enter a job title first");
                    return;
                  }
                  setGeneratingJD(true);
                  try {
                    const res = await aiService.generateJobDescription({ title, requirements: "" });
                    setValue("description", res.data?.description || res.description, { shouldValidate: true });
                    toast.success(isBn ? "AI দিয়ে বিবরণ তৈরি হয়েছে!" : "Job description generated!");
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || (isBn ? "বিবরণ তৈরি করা যায়নি" : "Failed to generate description"));
                  } finally {
                    setGeneratingJD(false);
                  }
                }}
              >
                {generatingJD ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {isBn ? "AI দিয়ে তৈরি করুন" : "AI Generate"}
              </Button>
            </h2>

            <div className="space-y-1.5">
              <Label>{isBn ? "চাকরির বিবরণ" : "Job Description"} *</Label>
              <RichTextEditor
                value={watch("description") || ""}
                onChange={(val) => setValue("description", val, { shouldValidate: true })}
                placeholder={isBn ? "চাকরির বিস্তারিত বিবরণ..." : "Describe the job in detail..."}
                maxLength={10000}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>{isBn ? "চাকরির সারসংক্ষেপ" : "Job Summary"}</Label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder={isBn ? "এক লাইনে চাকরির সারসংক্ষেপ..." : "Brief summary of the role..."}
                {...register("job_summary")}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{isBn ? "দায়িত্ব" : "Responsibilities"} *</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder={isBn ? "প্রধান দায়িত্বগুলো লিখুন..." : "List main responsibilities..."}
                {...register("responsibilities")}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{isBn ? "প্রয়োজনীয় দক্ষতা" : "Required Skills"}</Label>
              <Input
                placeholder={isBn ? "React, Node.js, TypeScript (কমা দিয়ে আলাদা করুন)" : "React, Node.js, TypeScript (comma-separated)"}
                {...register("required_skills")}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{isBn ? "শিক্ষাগত যোগ্যতা" : "Educational Requirements"}</Label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder={isBn ? "BS.c in CSE, বা সমতুল্য..." : "BS.c in CSE or equivalent..."}
                {...register("education_requirements")}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{isBn ? "অভিজ্ঞতার প্রয়োজনীয়তা" : "Experience Requirements"}</Label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder={isBn ? "৩+ বছরের অভিজ্ঞতা..." : "3+ years experience..."}
                {...register("experience_requirements")}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{isBn ? "অতিরিক্ত প্রয়োজনীয়তা" : "Additional Requirements"}</Label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder={isBn ? "অতিরিক্ত যোগ্যতা..." : "Nice-to-have skills..."}
                {...register("additional_requirements")}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{isBn ? "সুবিধা ও পার্কিং" : "Benefits & Perks"}</Label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder={isBn ? "হেলথ ইন্সুরেন্স, ফ্লেক্সিবল আওয়ার্স..." : "Health insurance, flexible hours..."}
                {...register("benefits")}
              />
            </div>
          </CardContent>
        </Card>

        {/* ════════════════════════════════════════════
            Section 4: Candidate Requirements
           ════════════════════════════════════════════ */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">
              {isBn ? "৪. প্রার্থীর প্রয়োজনীয়তা" : "4. Candidate Requirements"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{isBn ? "ন্যূনতম বয়স" : "Minimum Age"}</Label>
                <Input type="number" min={16} max={70} placeholder="18" {...register("min_age")} />
              </div>
              <div className="space-y-1.5">
                <Label>{isBn ? "সর্বোচ্চ বয়স" : "Maximum Age"}</Label>
                <Input type="number" min={16} max={70} placeholder="35" {...register("max_age")} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{isBn ? "লিঙ্গ পছন্দ" : "Gender Preference"}</Label>
                <Select value={watch("gender_preference") || "any"} onValueChange={(v) => setValue("gender_preference", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">{isBn ? "যেকোনো" : "Any"}</SelectItem>
                    <SelectItem value="male">{isBn ? "পুরুষ" : "Male"}</SelectItem>
                    <SelectItem value="female">{isBn ? "মহিলা" : "Female"}</SelectItem>
                    <SelectItem value="other">{isBn ? "অন্যান্য" : "Other"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>{isBn ? "ভাষা দক্ষতা" : "Required Language Skills"}</Label>
                <Input placeholder={isBn ? "বাংলা, ইংরেজি (কমা দিয়ে)" : "English, Bengali (comma-separated)"} {...register("language_skills")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{isBn ? "প্রয়োজনীয় সার্টিফিকেশন" : "Required Certifications"}</Label>
              <Input placeholder={isBn ? "AWS, PMP (কমা দিয়ে)" : "AWS, PMP (comma-separated)"} {...register("required_certifications")} />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="driving"
                checked={watch("driving_license_required") || false}
                onCheckedChange={(checked) => setValue("driving_license_required", !!checked)}
              />
              <Label htmlFor="driving" className="cursor-pointer">
                {isBn ? "ড্রাইভিং লাইসেন্স প্রয়োজন" : "Driving License Required"}
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* ════════════════════════════════════════════
            Section 5: Application Information
           ════════════════════════════════════════════ */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">
              {isBn ? "৫. আবেদনের তথ্য" : "5. Application Information"}
            </h2>

            <div className="space-y-1.5">
              <Label>{isBn ? "আবেদনের পদ্ধতি" : "Application Method"}</Label>
              <Select value={watch("application_method") || "internal"} onValueChange={(v) => setValue("application_method", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">{isBn ? "প্ল্যাটফর্মের মাধ্যমে" : "Apply via this platform"}</SelectItem>
                  <SelectItem value="external">{isBn ? "বহিঃস্থ লিংক" : "External Application Link"}</SelectItem>
                  <SelectItem value="email">{isBn ? "ইমেইলে আবেদন" : "Email Application"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {applicationMethod === "external" && (
              <div className="space-y-1.5">
                <Label>{isBn ? "আবেদন URL" : "Application URL"}</Label>
                <Input type="url" placeholder="https://careers.company.com/apply" {...register("application_url")} />
                {errors.application_url && <p className="text-sm text-destructive">{errors.application_url.message}</p>}
              </div>
            )}

            {applicationMethod === "email" && (
              <div className="space-y-1.5">
                <Label>{isBn ? "আবেদন ইমেইল" : "Application Email"}</Label>
                <Input type="email" placeholder="jobs@company.com" {...register("application_email")} />
                {errors.application_email && <p className="text-sm text-destructive">{errors.application_email.message}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label>{isBn ? "প্রয়োজনীয় ডকুমেন্ট" : "Required Documents"}</Label>
              <div className="flex flex-wrap gap-3">
                {[
                  { key: "cv", label: "CV/Resume" },
                  { key: "cover_letter", label: isBn ? "কভার লেটার" : "Cover Letter" },
                  { key: "photo", label: isBn ? "ছবি" : "Photograph" },
                  { key: "certificate", label: isBn ? "সার্টিফিকেট" : "Certificate" },
                ].map((doc) => (
                  <div key={doc.key} className="flex items-center gap-2">
                    <Checkbox
                      id={`doc-${doc.key}`}
                      checked={requiredDocuments.includes(doc.key)}
                      onCheckedChange={() => toggleDocument(doc.key)}
                    />
                    <Label htmlFor={`doc-${doc.key}`} className="cursor-pointer text-sm">{doc.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {isBn ? "বাতিল" : "Cancel"}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting
              ? (isBn ? "পোস্ট হচ্ছে..." : "Posting...")
              : (isBn ? "চাকরি পোস্ট করুন" : "Post Job")}
          </Button>
        </div>
      </form>
    </div>
  );
}
