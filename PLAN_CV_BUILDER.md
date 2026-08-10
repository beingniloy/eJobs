# সিভি বিল্ডার আপডেট প্ল্যান — Afroza Akter-এর CV স্টাইল সাপোর্ট

## উদ্দেশ্য
বর্তমান সিভি বিল্ডারে এমন কিছু ফিল্ড ও সেকশন যোগ করা যা আফরোজা আক্তের-এর DOCX CV-তে আছে কিন্তু এখনো সাপোর্ট করা হয়নি। ফ্রন্টএন্ড + ব্যাকএন্ড দুটোই পরিবর্তন করতে হবে।

---

## গ্যাপ বিশ্লেষণ

### নতুন ফিল্ড যোগ করতে হবে (JSON কলামে ফিট করা যায় — নতুন মাইগ্রেশন লাগবে না)

| সেকশন | ফিল্ড | ভাষা (bn/en) |
|---|---|---|
| personal_info | father_name (পিতার নাম) | bn |
| personal_info | mother_name (মাতার নাম) | bn |
| personal_info | gender (লিঙ্গ) | bn |
| personal_info | marital_status (বৈবাহিক অবস্থা) | bn |
| personal_info | religion (ধর্ম) | bn |
| personal_info | blood_group (রক্তের গ্রুপ) | bn |
| personal_info | postal_code (পোস্টাল কোড) | bn |
| experience[] | department (বিভাগ) | bn/en |
| projects[] | supervisor (সুপারভাইজার) | bn/en |
| education[] | registration_number (RN নম্বর) | bn/en |

### নতুন সেকশন যোগ করতে হবে (নতুন JSON কলাম + মাইগ্রেশন লাগবে)

| সেকশন | ডাটা স্ট্রাকচার | উদাহরণ |
|---|---|---|
| references | `[{name, designation, organization, phone, email}]` | Prof. Dr. Rubayat... |
| training | `[{institute, title, major_topic, duration}]` | 6 মাস ইন্টার্নশিপ |

---

## বাস্তবায়ন পরিকল্পনা

### পর্যায় ১: ব্যাকএন্ড মাইগ্রেশন (নতুন কলাম)

**ফাইল:** `D:/Projects/ejobs/backend/database/migrations/xxxx_add_cv_fields_to_candidate_data_table.php` (নতুন মাইগ্রেশন)

```php
Schema::table('candidate_data', function (Blueprint $table) {
    $table->json('references')->nullable()->after('hobbies');
    $table->json('training')->nullable()->after('references');
});
```

**ফাইল:** `D:/Projects/ejobs/backend/app/Models/CandidateData.php`

- `fillable` অ্যারেতে `'references'` ও `'training'` যোগ করো
- `getFillable()` বা fillable array-এ যোগ করো

---

### পর্যায় ২: ব্যাকএন্ড কন্ট্রোলার আপডেট

**ফাইল:** `D:/Projects/ejobs/backend/app/Http/Controllers/Api/CvProfileController.php`

#### ২.১: `updateProfile` validation-এ যোগ করো:
```php
'references' => 'nullable|array',
'training' => 'nullable|array',
```

#### ২.২: `syncFromMainProfile`-তে যোগ করো (dedicated table থেকে JSON-এ):
```php
// References (candidate_references টেবিল থেকে)
$references = CandidateReference::where('user_id', $user->id)
    ->get()
    ->map(fn($r) => [
        'name' => $r->name,
        'designation' => $r->designation ?? '',
        'organization' => $r->organization ?? '',
        'phone' => $r->phone ?? '',
        'email' => $r->email ?? '',
    ])->toArray();

// Training (candidate_trainings টেবিল থেকে)
$training = CandidateTraining::where('user_id', $user->id)
    ->get()
    ->map(fn($t) => [
        'institute' => $t->institute_name ?? '',
        'title' => $t->title,
        'major_topic' => $t->major_topic ?? '',
        'duration' => $t->duration ?? '',
    ])->toArray();

$cvData->references = $references;
$cvData->training = $training;
```

---

### পর্যায় ৩: ব্যাকএন্ড রেন্ডারিং আপডেট

**ফাইল:** `D:/Projects/ejobs/backend/app/Services/Cv/CvRenderingService.php`

`buildViewData()` মেথডে যোগ করো:
```php
$references = $data['references'] ?? [];
$training = $data['training'] ?? [];
```

#### Blade টেমপ্লেট আপডেট (সব ৮টি টেমপ্লেট)

**ফাইল:** `D:/Projects/ejobs/backend/resources/views/cv_templates/*.blade.php`

প্রতিটি টেমপ্লেটে নতুন সেকশন রেন্ডার করার কোড যোগ করো:

```blade
{{-- Training Section --}}
@if(!empty($training))
<div class="section">
    <h2>Training</h2>
    @foreach($training as $t)
        <div class="entry">
            <strong>{{ $t['title'] ?? '' }}</strong>
            <span>{{ $t['institute'] ?? '' }}</span>
            <span>{{ $t['duration'] ?? '' }}</span>
        </div>
    @endforeach
</div>
@endif

{{-- References Section --}}
@if(!empty($references))
<div class="section">
    <h2>References</h2>
    @foreach($references as $ref)
        <div class="entry">
            <strong>{{ $ref['name'] ?? '' }}</strong>
            <span>{{ $ref['designation'] ?? '' }}</span>
            <span>{{ $ref['organization'] ?? '' }}</span>
        </div>
    @endforeach
</div>
@endif
```

---

### পর্যায় ৪: ফ্রন্টএন্ড — টাইপ আপডেট

**ফাইল:** `D:/Projects/ejobs/frontend/src/types/index.ts`

`PersonalInfo` ইন্টারফেসে যোগ করো:
```typescript
father_name?: string;
mother_name?: string;
gender?: string;
marital_status?: string;
religion?: string;
blood_group?: string;
postal_code?: string;
```

`Experience` ইন্টারফেসে যোগ করো:
```typescript
department?: string;
```

`Project` ইন্টারফেসে যোগ করো:
```typescript
supervisor?: string;
```

`Education` ইন্টারফেসে যোগ করো:
```typescript
registration_number?: string;
```

`CvProfile` ইন্টারফেসে যোগ করো:
```typescript
references?: { name: string; designation?: string; organization?: string; phone?: string; email?: string }[];
training?: { institute: string; title: string; major_topic?: string; duration?: string }[];
```

---

### পর্যায় ৫: ফ্রন্টএন্ড — CV_SECTIONS আপডেট

**ফাইল:** `D:/Projects/ejobs/frontend/src/constants/cv-builder.ts`

```typescript
import { ... } from "lucide-react";

export const CV_SECTIONS = [
  // ... existing sections ...
  { key: "references", label_en: "References", label_bn: "রেফারেন্স", icon: Users },   // নতুন
  { key: "training", label_en: "Training", label_bn: "প্রশিক্ষণ", icon: BookOpen },    // নতুন
];
```

---

### পর্যায় ৬: ফ্রন্টএন্ড — নতুন সেকশন ফর্ম কম্পোনেন্ট

#### ৬.১: `PersonalSectionForm.tsx`-এ নতুন ফিল্ড যোগ

নতুন ফিল্ডগুলো (পিতা/মাতার নাম, লিঙ্গ, বৈবাহিক অবস্থা, ধর্ম, রক্তের গ্রুপ, পোস্টাল কোড) যোগ করো।

**লিঙ্গ (gender)** — Select dropdown:
- Male / Female / Other (বা Bengali: পুরুষ / নারী / অন্যান্য)

**বৈবাহিক অবস্থা (marital_status)** — Select dropdown:
- Unmarried / Married / Divorced / Widowed

**রক্তের গ্রুপ (blood_group)** — Select dropdown:
- A+, A-, B+, B-, AB+, AB-, O+, O-

#### ৬.২: `ExperienceSectionForm.tsx`-এ `department` ফিল্ড যোগ

সিম্পল Input — পজিশন/কোম্পানির নিচে।

#### ৬.৩: `ProjectsSectionForm.tsx`-এ `supervisor` ফিল্ড যোগ

সিম্পল Input — নাম/URL-এর নিচে।

#### ৬.৪: `EducationSectionForm.tsx`-এ `registration_number` ফিল্ড যোগ

GPA/Grade এর পাশে বা নিচে।

#### ৬.৫: নতুন `ReferencesSectionForm.tsx` তৈরি

**ফাইল:** `D:/Projects/ejobs/frontend/src/components/cv/sections/ReferencesSectionForm.tsx`

ফিল্ড: Name, Designation, Organization, Phone, Email — প্রতিটি এন্ট্রি যোগ/মুছে ফেলা যায়।

#### ৬.৬: নতুন `TrainingSectionForm.tsx` তৈরি

**ফাইল:** `D:/Projects/ejobs/frontend/src/components/cv/sections/TrainingSectionForm.tsx`

ফিল্ড: Institute, Title, Major Topic, Duration — প্রতিটি এন্ট্রি যোগ/মুছে ফেলা যায়।

#### ৬.৭: `SectionForm.tsx` আপডেট — নতুন সেকশন রুটিং যোগ করো

**ফাইল:** `D:/Projects/ejobs/frontend/src/components/cv/SectionForm.tsx`

```typescript
import ReferencesSectionForm from "./sections/ReferencesSectionForm";
import TrainingSectionForm from "./sections/TrainingSectionForm";

// switch/case বা map-এ যোগ:
case "references":
  return <ReferencesSectionForm data={data} onChange={onChange} isBn={isBn} />;
case "training":
  return <TrainingSectionForm data={data} onChange={onChange} isBn={isBn} />;
```

---

### পর্যায় ৭: ফ্রন্টএন্ড — `buildClientPreview` আপডেট

**ফাইল:** `D:/Projects/ejobs/frontend/src/hooks/use-resume-editor.ts`

`buildClientPreview` ফাংশনে যোগ করো:

```typescript
// References
const refs = (data.references || []) as any[];
sectionContent["references"] = refs.map(r =>
  `<div style="margin-bottom:8px"><strong>${get(r.name)}</strong>${r.designation ? " — " + get(r.designation) : ""}${r.organization ? ", " + get(r.organization) : ""}</div>`
).join("");

// Training
const trainings = (data.training || []) as any[];
sectionContent["training"] = trainings.map(t =>
  `<div style="margin-bottom:8px"><strong>${get(t.title)}</strong>${t.institute ? " — " + get(t.institute) : ""}${t.duration ? " (" + get(t.duration) + ")" : ""}</div>`
).join("");
```

সাথে `personal` সেকশনে নতুন ফিল্ডগুলোও রেন্ডার করো (পিতা/মাতার নাম, ধর্ম, রক্তের গ্রুপ ইত্যাদি) — যদি টেমপ্লেট সাপোর্ট করে।

---

### পর্যায় ৮: ফ্রন্টএন্ড — `InlineEditor` আপডেট

**ফাইল:** `D:/Projects/ejobs/frontend/src/components/cv/InlineEditor.tsx`

সিস্টেমটি `CV_SECTIONS` অ্যারে থেকে সেকশন লুপ করে। নতুন সেকশনগুলো (`references`, `training`) যোগ হলে অটোমেটিকভাবে দেখাবে — আলাদাভাবে পরিবর্তন লাগবে না।

---

## ফাইল পরিবর্তন সারসংক্ষেপ

| ফাইল | পরিবর্তন |
|---|---|
| `backend/database/migrations/xxxx_...php` | নতুন: `references`, `training` কলাম |
| `backend/app/Models/CandidateData.php` | `fillable`-এ যোগ |
| `backend/app/Http/Controllers/Api/CvProfileController.php` | validation + syncFromMainProfile আপডেট |
| `backend/app/Services/Cv/CvRenderingService.php` | buildViewData-তে যোগ |
| `backend/resources/views/cv_templates/*.blade.php` | সব ৮টি টেমপ্লেটে নতুন সেকশন |
| `frontend/src/types/index.ts` | PersonalInfo, Experience, Project, Education, CvProfile আপডেট |
| `frontend/src/constants/cv-builder.ts` | CV_SECTIONS-এ যোগ |
| `frontend/src/components/cv/sections/PersonalSectionForm.tsx` | নতুন ফিল্ড |
| `frontend/src/components/cv/sections/ExperienceSectionForm.tsx` | department ফিল্ড |
| `frontend/src/components/cv/sections/ProjectsSectionForm.tsx` | supervisor ফিল্ড |
| `frontend/src/components/cv/sections/EducationSectionForm.tsx` | registration_number ফিল্ড |
| `frontend/src/components/cv/sections/ReferencesSectionForm.tsx` | নতুন ফাইল |
| `frontend/src/components/cv/sections/TrainingSectionForm.tsx` | নতুন ফাইল |
| `frontend/src/components/cv/SectionForm.tsx` | নতুন সেকশন রুটিং |
| `frontend/src/hooks/use-resume-editor.ts` | buildClientPreview আপডেট |

---

## অগ্রাধিকার

1. **MVP:** কাজ ৪ + ৫ + ৬ (নতুন ফিল্ড + সেকশন ফর্ম)
2. **মাধ্যমিক:** কাজ ১ + ২ + ৩ (মাইগ্রেশন + কন্ট্রোলার + রেন্ডারিং)
3. **শেষ:** কাজ ৭ + ৮ (Preview + Editor)
