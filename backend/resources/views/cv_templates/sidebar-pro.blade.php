{{-- Sidebar Pro Template (Fixed: Array variables now guarded) --}}

<div class="sidebar-pro">
  {{-- Profile Photo --}}
  @if(!empty($personal_info['photo_url']))
    <div class="photo-section">
      <img src="{{ $personal_info['photo_url'] }}" alt="{{ $personal_info['full_name'] ?? '' }}" />
    </div>
  @endif

  {{-- Personal Info --}}
  <div class="personal-info">
    <h1 class="name">{{ is_array($personal_info) ? ($personal_info['full_name'] ?? '') : $personal_info }}</h1>

    @if(!empty($personal_info['title']))
      <p class="title">{{ $personal_info['title'] }}</p>
    @endif

    <div class="contact-details">
      @if(!empty($personal_info['email']))
        <div class="contact-item">
          <span class="icon">✉</span>
          <span>{{ $personal_info['email'] }}</span>
        </div>
      @endif

      @if(!empty($personal_info['phone']))
        <div class="contact-item">
          <span class="icon">☎</span>
          <span>{{ $personal_info['phone'] }}</span>
        </div>
      @endif

      @if(!empty($personal_info['location']))
        <div class="contact-item">
          <span class="icon">📍</span>
          <span>{{ $personal_info['location'] }}</span>
        </div>
      @endif

      @if(!empty($personal_info['address']))
        <div class="contact-item">
          <span class="icon">🏠</span>
          <span>{{ $personal_info['address'] }}</span>
        </div>
      @endif
    </div>
  </div>

  {{-- Summary --}}
  @if(!empty($personal_info['summary']))
    <div class="section">
      <h2>Professional Summary</h2>
      <p class="summary">{{ $personal_info['summary'] }}</p>
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
                <span class="skill-name">{{ $skill['name'] ?? '' }}</span>
                @if(!empty($skill['level']))
                  <span class="skill-level">{{ $skill['level'] }}</span>
                @endif
              </div>
            @else
              <div class="skill-item">
                <span class="skill-name">{{ $skill }}</span>
              </div>
            @endif
          @endforeach
        @else
          <p>{{ $skills }}</p>
        @endif
      </div>
    </div>
  @endif

  {{-- Languages --}}
  @if(!empty($languages))
    <div class="section">
      <h2>Languages</h2>
      @if(is_array($languages))
        @foreach($languages as $lang)
          <div class="language-item">
            @if(is_array($lang))
              <span class="lang-name">{{ $lang['name'] ?? '' }}</span>
              @if(!empty($lang['proficiency']))
                <span class="lang-level">{{ $lang['proficiency'] }}</span>
              @endif
            @else
              <span class="lang-name">{{ $lang }}</span>
            @endif
          </div>
        @endforeach
      @endif
    </div>
  @endif

  {{-- Certifications --}}
  @if(!empty($certifications))
    <div class="section">
      <h2>Certifications</h2>
      @if(is_array($certifications))
        @foreach($certifications as $cert)
          <div class="cert-item">
            @if(is_array($cert))
              <p class="cert-name">{{ $cert['name'] ?? '' }}</p>
              @if(!empty($cert['issuer']))
                <p class="cert-issuer">{{ $cert['issuer'] }}</p>
              @endif
              @if(!empty($cert['date']))
                <p class="cert-date">{{ $cert['date'] }}</p>
              @endif
            @else
              <p class="cert-name">{{ $cert }}</p>
            @endif
          </div>
        @endforeach
      @endif
    </div>
  @endif

  {{-- Social Links --}}
  @if(!empty($social_links))
    <div class="section">
      <h2>Social Links</h2>
      @if(is_array($social_links))
        @foreach($social_links as $platform => $url)
          @if(!empty($url))
            <div class="social-item">
              <span class="social-platform">{{ ucfirst(str_replace('_', ' ', $platform)) }}</span>
              <a href="{{ $url }}" target="_blank" rel="noopener noreferrer">{{ $url }}</a>
            </div>
          @endif
        @endforeach
      @endif
    </div>
  @endif

  {{-- Experience --}}
  @if(!empty($experience))
    <div class="section">
      <h2>Work Experience</h2>
      @if(is_array($experience))
        @foreach($experience as $exp)
          <div class="experience-item">
            @if(is_array($exp))
              <h3 class="exp-title">{{ $exp['position'] ?? $exp['job_title'] ?? '' }}</h3>
              <p class="exp-company">{{ $exp['company'] ?? $exp['company_name'] ?? '' }}</p>
              @if(!empty($exp['location']))
                <p class="exp-location">{{ $exp['location'] }}</p>
              @endif
              <p class="exp-dates">
                {{ $exp['start_date'] ?? '' }} — {{ $exp['end_date'] ?? ($exp['is_current'] ? 'Present' : '') }}
              </p>
              @if(!empty($exp['description']))
                <p class="exp-description">{{ $exp['description'] }}</p>
              @endif
            @endif
          </div>
        @endforeach
      @endif
    </div>
  @endif

  {{-- Education --}}
  @if(!empty($education))
    <div class="section">
      <h2>Education</h2>
      @if(is_array($education))
        @foreach($education as $edu)
          <div class="education-item">
            @if(is_array($edu))
              <h3 class="edu-degree">{{ $edu['degree'] ?? $edu['institution'] ?? '' }}</h3>
              @if(!empty($edu['institution']) && ($edu['degree'] ?? '') !== ($edu['institution'] ?? ''))
                <p class="edu-institution">{{ $edu['institution'] }}</p>
              @endif
              @if(!empty($edu['field']))
                <p class="edu-field">{{ $edu['field'] }}</p>
              @endif
              @if(!empty($edu['year']) || !empty($edu['start_date']))
                <p class="edu-dates">{{ $edu['year'] ?? $edu['start_date'] ?? '' }}@if(!empty($edu['end_date'])) — {{ $edu['end_date'] }}@endif</p>
              @endif
              @if(!empty($edu['gpa_or_cgpa']))
                <p class="edu-gpa">GPA: {{ $edu['gpa_or_cgpa'] }}</p>
              @endif
              @if(!empty($edu['grade']))
                <p class="edu-grade">Grade: {{ $edu['grade'] }}</p>
              @endif
              @if(!empty($edu['description']))
                <p class="edu-description">{{ $edu['description'] }}</p>
              @endif
            @endif
          </div>
        @endforeach
      @endif
    </div>
  @endif

  {{-- Projects --}}
  @if(!empty($projects))
    <div class="section">
      <h2>Projects</h2>
      @if(is_array($projects))
        @foreach($projects as $project)
          <div class="project-item">
            @if(is_array($project))
              <h3 class="proj-name">{{ $project['name'] ?? $project['project_name'] ?? '' }}</h3>
              @if(!empty($project['description']))
                <p class="proj-description">{{ $project['description'] }}</p>
              @endif
              @if(!empty($project['technologies']))
                <p class="proj-tech">
                  @if(is_array($project['technologies']))
                    {{ implode(', ', $project['technologies']) }}
                  @else
                    {{ $project['technologies'] }}
                  @endif
                </p>
              @endif
              @if(!empty($project['url']))
                <a class="proj-link" href="{{ $project['url'] }}" target="_blank">{{ $project['url'] }}</a>
              @endif
            @endif
          </div>
        @endforeach
      @endif
    </div>
  @endif

  {{-- Awards --}}
  @if(!empty($awards))
    <div class="section">
      <h2>Awards & Honors</h2>
      @if(is_array($awards))
        @foreach($awards as $award)
          <div class="award-item">
            @if(is_array($award))
              <p class="award-title">{{ $award['title'] ?? '' }}</p>
              @if(!empty($award['issuer']))
                <p class="award-issuer">{{ $award['issuer'] }}</p>
              @endif
              @if(!empty($award['date']))
                <p class="award-date">{{ $award['date'] }}</p>
              @endif
            @else
              <p>{{ $award }}</p>
            @endif
          </div>
        @endforeach
      @endif
    </div>
  @endif

  {{-- Hobbies --}}
  @if(!empty($hobbies))
    <div class="section">
      <h2>Hobbies & Interests</h2>
      @if(is_array($hobbies))
        <div class="hobbies-list">
          @foreach($hobbies as $hobby)
            <span class="hobby-badge">
              {{ is_array($hobby) ? ($hobby['name'] ?? $hobby) : $hobby }}
            </span>
          @endforeach
        </div>
      @endif
    </div>
  @endif
</div>

<style>
  .sidebar-pro {
    font-family: 'Inter', 'Segoe UI', sans-serif;
    padding: 0;
    max-width: 100%;
  }

  .photo-section {
    text-align: center;
    margin-bottom: 16px;
  }

  .photo-section img {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
  }

  .personal-info {
    text-align: center;
    margin-bottom: 20px;
  }

  .personal-info .name {
    font-size: 22px;
    font-weight: 700;
    margin: 0 0 4px 0;
  }

  .personal-info .title {
    font-size: 14px;
    color: #666;
    margin: 0 0 12px 0;
  }

  .contact-details {
    font-size: 12px;
    color: #444;
  }

  .contact-item {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
    justify-content: center;
  }

  .section {
    margin-bottom: 20px;
  }

  .section h2 {
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #333;
    padding-bottom: 6px;
    margin-bottom: 10px;
  }

  .summary {
    font-size: 12px;
    line-height: 1.5;
    color: #333;
  }

  .skills-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .skill-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
  }

  .skill-level {
    color: #666;
    font-size: 11px;
  }

  .language-item {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-bottom: 4px;
  }

  .cert-item, .experience-item, .education-item, .project-item, .award-item {
    margin-bottom: 12px;
  }

  .exp-title, .edu-degree, .proj-name, .award-title, .cert-name {
    font-size: 13px;
    font-weight: 600;
    margin: 0;
  }

  .exp-company, .edu-institution, .cert-issuer, .award-issuer, .proj-tech {
    font-size: 12px;
    color: #555;
  }

  .exp-dates, .edu-dates, .cert-date, .award-date {
    font-size: 11px;
    color: #888;
  }

  .exp-description, .proj-description, .edu-description {
    font-size: 12px;
    color: #333;
    margin-top: 4px;
    line-height: 1.4;
  }

  .proj-link {
    font-size: 11px;
    color: #2563eb;
    text-decoration: none;
  }

  .hobbies-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .hobby-badge {
    background: #f3f4f6;
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 11px;
  }

  .social-item {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-bottom: 4px;
  }

  .social-item a {
    color: #2563eb;
    text-decoration: none;
  }
</style>