@php
// ── Safely extract every variable as a string before any {{ }} output ──
$pi = is_array($personal_info) ? $personal_info : [];
$_name   = is_string($pi['full_name'] ?? null) ? $pi['full_name'] : '';
$_title  = is_string($pi['title'] ?? null) ? $pi['title'] : '';
$_email  = is_string($pi['email'] ?? null) ? $pi['email'] : '';
$_phone  = is_string($pi['phone'] ?? null) ? $pi['phone'] : '';
$_loc    = is_string($pi['location'] ?? null) ? $pi['location'] : '';
$_addr   = is_string($pi['address'] ?? null) ? $pi['address'] : '';
$_summary = is_string($pi['summary'] ?? null) ? $pi['summary'] : '';
$_photo  = is_string($pi['photo_url'] ?? null) ? $pi['photo_url'] : '';
$_photo_attr = is_string($pi['full_name'] ?? null) ? $pi['full_name'] : '';

$_skills_raw   = is_array($skills ?? null) ? $skills : [];
$_langs_raw    = is_array($languages ?? null) ? $languages : [];
$_certs_raw    = is_array($certifications ?? null) ? $certifications : [];
$_social_raw   = is_array($social_links ?? null) ? $social_links : [];
$_exp_raw      = is_array($experience ?? null) ? $experience : [];
$_edu_raw      = is_array($education ?? null) ? $education : [];
$_proj_raw     = is_array($projects ?? null) ? $projects : [];
$_awards_raw   = is_array($awards ?? null) ? $awards : [];
$_hobbies_raw  = is_array($hobbies ?? null) ? $hobbies : [];
@endphp

<div class="sidebar-pro">

  {{-- Profile Photo --}}
  @if($_photo)
    <div class="photo-section">
      <img src="{{ $_photo }}" alt="{{ $_photo_attr }}" />
    </div>
  @endif

  {{-- Personal Info --}}
  <div class="personal-info">
    <h1 class="name">{{ $_name }}</h1>
    @if($_title)
      <p class="title">{{ $_title }}</p>
    @endif

    <div class="contact-details">
      @if($_email)
        <div class="contact-item"><span class="icon">✉</span><span>{{ $_email }}</span></div>
      @endif
      @if($_phone)
        <div class="contact-item"><span class="icon">☎</span><span>{{ $_phone }}</span></div>
      @endif
      @if($_loc)
        <div class="contact-item"><span class="icon">📍</span><span>{{ $_loc }}</span></div>
      @endif
      @if($_addr)
        <div class="contact-item"><span class="icon">🏠</span><span>{{ $_addr }}</span></div>
      @endif
    </div>
  </div>

  {{-- Summary --}}
  @if($_summary)
    <div class="section">
      <h2>Professional Summary</h2>
      <p class="summary">{{ $_summary }}</p>
    </div>
  @endif

  {{-- Skills --}}
  @if(count($_skills_raw) > 0)
    <div class="section">
      <h2>Skills</h2>
      <div class="skills-list">
        @foreach($_skills_raw as $sk)
          @php
            $sk_name  = is_array($sk) ? ($sk['name'] ?? '') : $sk;
            $sk_level = is_array($sk) ? ($sk['level'] ?? '') : '';
            $sk_name  = is_string($sk_name) ? $sk_name : '';
            $sk_level = is_string($sk_level) ? $sk_level : '';
          @endphp
          <div class="skill-item">
            <span class="skill-name">{{ $sk_name }}</span>
            @if($sk_level)
              <span class="skill-level">{{ $sk_level }}</span>
            @endif
          </div>
        @endforeach
      </div>
    </div>
  @endif

  {{-- Languages --}}
  @if(count($_langs_raw) > 0)
    <div class="section">
      <h2>Languages</h2>
      @foreach($_langs_raw as $lg)
        @php
          $lg_name = is_array($lg) ? ($lg['name'] ?? '') : (is_string($lg) ? $lg : '');
          $lg_lev  = is_array($lg) ? ($lg['proficiency'] ?? '') : '';
          $lg_name = is_string($lg_name) ? $lg_name : '';
          $lg_lev  = is_string($lg_lev) ? $lg_lev : '';
        @endphp
        <div class="language-item">
          <span class="lang-name">{{ $lg_name }}</span>
          @if($lg_lev)
            <span class="lang-level">{{ $lg_lev }}</span>
          @endif
        </div>
      @endforeach
    </div>
  @endif

  {{-- Certifications --}}
  @if(count($_certs_raw) > 0)
    <div class="section">
      <h2>Certifications</h2>
      @foreach($_certs_raw as $ct)
        @php
          $ct_name   = is_array($ct) ? ($ct['name'] ?? '') : (is_string($ct) ? $ct : '');
          $ct_issuer = is_array($ct) ? ($ct['issuer'] ?? '') : '';
          $ct_date   = is_array($ct) ? ($ct['date'] ?? '') : '';
          $ct_name   = is_string($ct_name) ? $ct_name : '';
          $ct_issuer = is_string($ct_issuer) ? $ct_issuer : '';
          $ct_date   = is_string($ct_date) ? $ct_date : '';
        @endphp
        <div class="cert-item">
          <p class="cert-name">{{ $ct_name }}</p>
          @if($ct_issuer)
            <p class="cert-issuer">{{ $ct_issuer }}</p>
          @endif
          @if($ct_date)
            <p class="cert-date">{{ $ct_date }}</p>
          @endif
        </div>
      @endforeach
    </div>
  @endif

  {{-- Social Links --}}
  @if(count($_social_raw) > 0)
    <div class="section">
      <h2>Social Links</h2>
      @foreach($_social_raw as $pl => $url)
        @php
          $url    = is_string($url) ? $url : '';
          $pl_str = is_string($pl) ? ucfirst(str_replace('_', ' ', $pl)) : '';
        @endphp
        @if($url)
          <div class="social-item">
            <span class="social-platform">{{ $pl_str }}</span>
            <a href="{{ $url }}" target="_blank" rel="noopener noreferrer">{{ $url }}</a>
          </div>
        @endif
      @endforeach
    </div>
  @endif

  {{-- Experience --}}
  @if(count($_exp_raw) > 0)
    <div class="section">
      <h2>Work Experience</h2>
      @foreach($_exp_raw as $ex)
        @if(is_array($ex))
          @php
            $ex_pos  = is_string($ex['position'] ?? $ex['job_title'] ?? null) ? ($ex['position'] ?? $ex['job_title'] ?? '') : '';
            $ex_co   = is_string($ex['company'] ?? $ex['company_name'] ?? null) ? ($ex['company'] ?? $ex['company_name'] ?? '') : '';
            $ex_loc  = is_string($ex['location'] ?? null) ? $ex['location'] : '';
            $ex_from = is_string($ex['start_date'] ?? null) ? $ex['start_date'] : '';
            $ex_to   = is_string($ex['end_date'] ?? null) ? $ex['end_date'] : '';
            $ex_cur  = !empty($ex['is_current']) && $ex['is_current'];
            $ex_desc = is_string($ex['description'] ?? null) ? $ex['description'] : '';
          @endphp
          <div class="experience-item">
            <h3 class="exp-title">{{ $ex_pos }}</h3>
            <p class="exp-company">{{ $ex_co }}</p>
            @if($ex_loc)
              <p class="exp-location">{{ $ex_loc }}</p>
            @endif
            <p class="exp-dates">{{ $ex_from }} — {{ $ex_to ?: ($ex_cur ? 'Present' : '') }}</p>
            @if($ex_desc)
              <p class="exp-description">{{ $ex_desc }}</p>
            @endif
          </div>
        @endif
      @endforeach
    </div>
  @endif

  {{-- Education --}}
  @if(count($_edu_raw) > 0)
    <div class="section">
      <h2>Education</h2>
      @foreach($_edu_raw as $ed)
        @if(is_array($ed))
          @php
            $ed_deg  = is_string($ed['degree'] ?? null) ? $ed['degree'] : '';
            $ed_inst = is_string($ed['institution'] ?? null) ? $ed['institution'] : '';
            $ed_fld  = is_string($ed['field'] ?? null) ? $ed['field'] : '';
            $ed_yr   = is_string($ed['year'] ?? null) ? $ed['year'] : '';
            $ed_from = is_string($ed['start_date'] ?? null) ? $ed['start_date'] : '';
            $ed_to   = is_string($ed['end_date'] ?? null) ? $ed['end_date'] : '';
            $ed_gpa  = is_string($ed['gpa_or_cgpa'] ?? null) ? $ed['gpa_or_cgpa'] : '';
            $ed_grad = is_string($ed['grade'] ?? null) ? $ed['grade'] : '';
            $ed_desc = is_string($ed['description'] ?? null) ? $ed['description'] : '';
            $ed_degree = $ed_deg ?: $ed_inst;
          @endphp
          <div class="education-item">
            <h3 class="edu-degree">{{ $ed_degree }}</h3>
            @if($ed_inst && $ed_deg !== $ed_inst)
              <p class="edu-institution">{{ $ed_inst }}</p>
            @endif
            @if($ed_fld)
              <p class="edu-field">{{ $ed_fld }}</p>
            @endif
            @if($ed_yr || $ed_from)
              <p class="edu-dates">{{ $ed_yr ?: $ed_from }}@if($ed_to) — {{ $ed_to }}@endif</p>
            @endif
            @if($ed_gpa)
              <p class="edu-gpa">GPA: {{ $ed_gpa }}</p>
            @endif
            @if($ed_grad)
              <p class="edu-grade">Grade: {{ $ed_grad }}</p>
            @endif
            @if($ed_desc)
              <p class="edu-description">{{ $ed_desc }}</p>
            @endif
          </div>
        @endif
      @endforeach
    </div>
  @endif

  {{-- Projects --}}
  @if(count($_proj_raw) > 0)
    <div class="section">
      <h2>Projects</h2>
      @foreach($_proj_raw as $pj)
        @if(is_array($pj))
          @php
            $pj_name  = is_string($pj['name'] ?? $pj['project_name'] ?? null) ? ($pj['name'] ?? $pj['project_name'] ?? '') : '';
            $pj_desc  = is_string($pj['description'] ?? null) ? $pj['description'] : '';
            $pj_tech  = $pj['technologies'] ?? null;
            $pj_url   = is_string($pj['url'] ?? null) ? $pj['url'] : '';
          @endphp
          <div class="project-item">
            <h3 class="proj-name">{{ $pj_name }}</h3>
            @if($pj_desc)
              <p class="proj-description">{{ $pj_desc }}</p>
            @endif
            @if($pj_tech)
              <p class="proj-tech">
                @if(is_array($pj_tech))
                  {{ implode(', ', array_map(function($t){ return is_string($t) ? $t : ''; }, $pj_tech)) }}
                @else
                  {{ is_string($pj_tech) ? $pj_tech : '' }}
                @endif
              </p>
            @endif
            @if($pj_url)
              <a class="proj-link" href="{{ $pj_url }}" target="_blank">{{ $pj_url }}</a>
            @endif
          </div>
        @endif
      @endforeach
    </div>
  @endif

  {{-- Awards --}}
  @if(count($_awards_raw) > 0)
    <div class="section">
      <h2>Awards & Honors</h2>
      @foreach($_awards_raw as $aw)
        @php
          $aw_title = is_array($aw) ? (is_string($aw['title'] ?? null) ? $aw['title'] : '') : (is_string($aw) ? $aw : '');
          $aw_iss   = is_array($aw) ? (is_string($aw['issuer'] ?? null) ? $aw['issuer'] : '') : '';
          $aw_date  = is_array($aw) ? (is_string($aw['date'] ?? null) ? $aw['date'] : '') : '';
        @endphp
        <div class="award-item">
          <p class="award-title">{{ $aw_title }}</p>
          @if($aw_iss)
            <p class="award-issuer">{{ $aw_iss }}</p>
          @endif
          @if($aw_date)
            <p class="award-date">{{ $aw_date }}</p>
          @endif
        </div>
      @endforeach
    </div>
  @endif

  {{-- Hobbies --}}
  @if(count($_hobbies_raw) > 0)
    <div class="section">
      <h2>Hobbies & Interests</h2>
      <div class="hobbies-list">
        @foreach($_hobbies_raw as $hb)
          @php
            $hb_text = is_array($hb) ? (is_string($hb['name'] ?? null) ? $hb['name'] : '') : (is_string($hb) ? $hb : '');
          @endphp
          @if($hb_text)
            <span class="hobby-badge">{{ $hb_text }}</span>
          @endif
        @endforeach
      </div>
    </div>
  @endif

</div>

<style>
  .sidebar-pro { font-family: 'Inter', 'Segoe UI', sans-serif; padding: 0; max-width: 100%; }
  .photo-section { text-align: center; margin-bottom: 16px; }
  .photo-section img { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; }
  .personal-info { text-align: center; margin-bottom: 20px; }
  .personal-info .name { font-size: 22px; font-weight: 700; margin: 0 0 4px 0; }
  .personal-info .title { font-size: 14px; color: #666; margin: 0 0 12px 0; }
  .contact-details { font-size: 12px; color: #444; }
  .contact-item { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; justify-content: center; }
  .section { margin-bottom: 20px; }
  .section h2 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #333; padding-bottom: 6px; margin-bottom: 10px; }
  .summary { font-size: 12px; line-height: 1.5; color: #333; }
  .skills-list { display: flex; flex-direction: column; gap: 4px; }
  .skill-item { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
  .skill-level { color: #666; font-size: 11px; }
  .language-item { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
  .cert-item, .experience-item, .education-item, .project-item, .award-item { margin-bottom: 12px; }
  .exp-title, .edu-degree, .proj-name, .award-title, .cert-name { font-size: 13px; font-weight: 600; margin: 0; }
  .exp-company, .edu-institution, .cert-issuer, .award-issuer, .proj-tech { font-size: 12px; color: #555; }
  .exp-dates, .edu-dates, .cert-date, .award-date { font-size: 11px; color: #888; }
  .exp-description, .proj-description, .edu-description { font-size: 12px; color: #333; margin-top: 4px; line-height: 1.4; }
  .proj-link { font-size: 11px; color: #2563eb; text-decoration: none; }
  .hobbies-list { display: flex; flex-wrap: wrap; gap: 6px; }
  .hobby-badge { background: #f3f4f6; padding: 3px 10px; border-radius: 12px; font-size: 11px; }
  .social-item { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
  .social-item a { color: #2563eb; text-decoration: none; }
</style>