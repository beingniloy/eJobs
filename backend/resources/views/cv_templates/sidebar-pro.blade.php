{{-- Sidebar Pro Template --}}
<div class="sidebar-pro">
  {{-- Profile Photo --}}
  @if(!empty($personal_info['photo_url']) && is_string($personal_info['photo_url']))
    <div class="photo-section">
      <img src="{{ (string)($personal_info['photo_url']) }}" alt="{{ is_string($personal_info['full_name'] ?? null) ? $personal_info['full_name'] : '' }}" />
    </div>
  @endif

  {{-- Personal Info --}}
  <div class="personal-info">
    <h1 class="name">{{ is_array($personal_info) ? (string)($personal_info['full_name'] ?? '') : (string)($personal_info ?? '') }}</h1>

    @if(!empty($personal_info['title']) && is_string($personal_info['title']))
      <p class="title">{{ (string)$personal_info['title'] }}</p>
    @endif

    <div class="contact-details">
      @if(!empty($personal_info['email']) && is_string($personal_info['email']))
        <div class="contact-item">
          <span class="icon">✉</span>
          <span>{{ (string)$personal_info['email'] }}</span>
        </div>
      @endif

      @if(!empty($personal_info['phone']) && is_string($personal_info['phone']))
        <div class="contact-item">
          <span class="icon">☎</span>
          <span>{{ (string)$personal_info['phone'] }}</span>
        </div>
      @endif

      @if(!empty($personal_info['location']) && is_string($personal_info['location']))
        <div class="contact-item">
          <span class="icon">📍</span>
          <span>{{ (string)$personal_info['location'] }}</span>
        </div>
      @endif

      @if(!empty($personal_info['address']) && is_string($personal_info['address']))
        <div class="contact-item">
          <span class="icon">🏠</span>
          <span>{{ (string)$personal_info['address'] }}</span>
        </div>
      @endif
    </div>
  </div>

  {{-- Summary --}}
  @if(!empty($personal_info['summary']) && is_string($personal_info['summary']))
    <div class="section">
      <h2>Professional Summary</h2>
      <p class="summary">{{ (string)$personal_info['summary'] }}</p>
    </div>
  @endif

  {{-- Skills --}}
  @if(!empty($skills))
    <div class="section">
      <h2>Skills</h2>
      <div class="skills-list">
        @if(is_array($skills))
          @foreach($skills as $skill)
            @if(is_array($skill))
              <div class="skill-item">
                <span class="skill-name">{{ is_string($skill['name'] ?? null) ? $skill['name'] : '' }}</span>
                @if(!empty($skill['level']) && is_string($skill['level']))
                  <span class="skill-level">{{ (string)$skill['level'] }}</span>
                @endif
              </div>
            @elseif(is_string($skill))
              <div class="skill-item">
                <span class="skill-name">{{ $skill }}</span>
              </div>
            @endif
          @endforeach
        @endif
      </div>
    </div>
  @endif

  {{-- Languages --}}
  @if(!empty($languages) && is_array($languages))
    <div class="section">
      <h2>Languages</h2>
      @foreach($languages as $lang)
        <div class="language-item">
          @if(is_array($lang))
            <span class="lang-name">{{ is_string($lang['name'] ?? null) ? $lang['name'] : '' }}</span>
            @if(!empty($lang['proficiency']) && is_string($lang['proficiency']))
              <span class="lang-level">{{ (string)$lang['proficiency'] }}</span>
            @endif
          @elseif(is_string($lang))
            <span class="lang-name">{{ $lang }}</span>
          @endif
        </div>
      @endforeach
    </div>
  @endif

  {{-- Certifications --}}
  @if(!empty($certifications) && is_array($certifications))
    <div class="section">
      <h2>Certifications</h2>
      @foreach($certifications as $cert)
        <div class="cert-item">
          @if(is_array($cert))
            <p class="cert-name">{{ is_string($cert['name'] ?? null) ? $cert['name'] : '' }}</p>
            @if(!empty($cert['issuer']) && is_string($cert['issuer']))
              <p class="cert-issuer">{{ (string)$cert['issuer'] }}</p>
            @endif
            @if(!empty($cert['date']) && is_string($cert['date']))
              <p class="cert-date">{{ (string)$cert['date'] }}</p>
            @endif
          @elseif(is_string($cert))
            <p class="cert-name">{{ $cert }}</p>
          @endif
        </div>
      @endforeach
    </div>
  @endif

  {{-- Social Links --}}
  @if(!empty($social_links) && is_array($social_links))
    <div class="section">
      <h2>Social Links</h2>
      @foreach($social_links as $platform => $url)
        @if(!empty($url) && is_string($url))
          <div class="social-item">
            <span class="social-platform">{{ is_string($platform) ? ucfirst(str_replace('_', ' ', $platform)) : '' }}</span>
            <a href="{{ $url }}" target="_blank" rel="noopener noreferrer">{{ $url }}</a>
          </div>
        @endif
      @endforeach
    </div>
  @endif

  {{-- Experience --}}
  @if(!empty($experience) && is_array($experience))
    <div class="section">
      <h2>Work Experience</h2>
      @foreach($experience as $exp)
        @if(is_array($exp))
          <div class="experience-item">
            <h3 class="exp-title">{{ is_string($exp['position'] ?? $exp['job_title'] ?? null) ? ($exp['position'] ?? $exp['job_title']) : '' }}</h3>
            <p class="exp-company">{{ is_string($exp['company'] ?? $exp['company_name'] ?? null) ? ($exp['company'] ?? $exp['company_name']) : '' }}</p>
            @if(!empty($exp['location']) && is_string($exp['location']))
              <p class="exp-location">{{ (string)$exp['location'] }}</p>
            @endif
            <p class="exp-dates">
              {{ is_string($exp['start_date'] ?? null) ? $exp['start_date'] : '' }} — {{ is_string($exp['end_date'] ?? null) ? $exp['end_date'] : ($exp['is_current'] ? 'Present' : '') }}
            </p>
            @if(!empty($exp['description']) && is_string($exp['description']))
              <p class="exp-description">{{ (string)$exp['description'] }}</p>
            @endif
          </div>
        @endif
      @endforeach
    </div>
  @endif

  {{-- Education --}}
  @if(!empty($education) && is_array($education))
    <div class="section">
      <h2>Education</h2>
      @foreach($education as $edu)
        @if(is_array($edu))
          <div class="education-item">
            <h3 class="edu-degree">{{ is_string($edu['degree'] ?? $edu['institution'] ?? null) ? ($edu['degree'] ?? $edu['institution']) : '' }}</h3>
            @if(!empty($edu['institution']) && is_string($edu['institution']) && (string)($edu['degree'] ?? '') !== (string)($edu['institution'] ?? ''))
              <p class="edu-institution">{{ $edu['institution'] }}</p>
            @endif
            @if(!empty($edu['field']) && is_string($edu['field']))
              <p class="edu-field">{{ (string)$edu['field'] }}</p>
            @endif
            @if((!empty($edu['year']) && is_string($edu['year'])) || (!empty($edu['start_date']) && is_string($edu['start_date'])))
              <p class="edu-dates">{{ is_string($edu['year'] ?? null) ? $edu['year'] : (is_string($edu['start_date'] ?? null) ? $edu['start_date'] : '') }}@if(!empty($edu['end_date']) && is_string($edu['end_date'])) — {{ $edu['end_date'] }}@endif</p>
            @endif
            @if(!empty($edu['gpa_or_cgpa']) && is_string($edu['gpa_or_cgpa']))
              <p class="edu-gpa">GPA: {{ (string)$edu['gpa_or_cgpa'] }}</p>
            @endif
            @if(!empty($edu['grade']) && is_string($edu['grade']))
              <p class="edu-grade">Grade: {{ (string)$edu['grade'] }}</p>
            @endif
            @if(!empty($edu['description']) && is_string($edu['description']))
              <p class="edu-description">{{ (string)$edu['description'] }}</p>
            @endif
          </div>
        @endif
      @endforeach
    </div>
  @endif

  {{-- Projects --}}
  @if(!empty($projects) && is_array($projects))
    <div class="section">
      <h2>Projects</h2>
      @foreach($projects as $project)
        @if(is_array($project))
          <div class="project-item">
            <h3 class="proj-name">{{ is_string($project['name'] ?? $project['project_name'] ?? null) ? ($project['name'] ?? $project['project_name']) : '' }}</h3>
            @if(!empty($project['description']) && is_string($project['description']))
              <p class="proj-description">{{ (string)$project['description'] }}</p>
            @endif
            @if(!empty($project['technologies']))
              <p class="proj-tech">
                @if(is_array($project['technologies']))
                  {{ implode(', ', array_map(function($t) { return is_string($t) ? $t : ''; }, $project['technologies'])) }}
                @elseif(is_string($project['technologies']))
                  {{ $project['technologies'] }}
                @endif
              </p>
            @endif
            @if(!empty($project['url']) && is_string($project['url']))
              <a class="proj-link" href="{{ $project['url'] }}" target="_blank">{{ $project['url'] }}</a>
            @endif
          </div>
        @endif
      @endforeach
    </div>
  @endif

  {{-- Awards --}}
  @if(!empty($awards) && is_array($awards))
    <div class="section">
      <h2>Awards & Honors</h2>
      @foreach($awards as $award)
        <div class="award-item">
          @if(is_array($award))
            <p class="award-title">{{ is_string($award['title'] ?? null) ? $award['title'] : '' }}</p>
            @if(!empty($award['issuer']) && is_string($award['issuer']))
              <p class="award-issuer">{{ (string)$award['issuer'] }}</p>
            @endif
            @if(!empty($award['date']) && is_string($award['date']))
              <p class="award-date">{{ (string)$award['date'] }}</p>
            @endif
          @elseif(is_string($award))
            <p>{{ $award }}</p>
          @endif
        </div>
      @endforeach
    </div>
  @endif

  {{-- Hobbies --}}
  @if(!empty($hobbies) && is_array($hobbies))
    <div class="section">
      <h2>Hobbies & Interests</h2>
      <div class="hobbies-list">
        @foreach($hobbies as $hobby)
          <span class="hobby-badge">
            {{ is_array($hobby) ? (string)($hobby['name'] ?? '') : (is_string($hobby) ? $hobby : '') }}
          </span>
        @endforeach
      </div>
    </div>
  @endif
</div>

<style>
  .sidebar-pro {
    font-family: 'Inter', 'Segoe UI', sans-serif;
    padding: 0;
    max-width: 100%;
  }
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