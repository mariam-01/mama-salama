<!DOCTYPE html>
<html lang="${locale.currentLanguageTag}"<#if locale.currentLanguageTag == "ar"> dir="rtl"</#if>>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${msg("loginTitle")} — Mama Salama</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:wght@500;600&display=swap" rel="stylesheet">
  <link rel="icon" type="image/svg+xml" href="${url.resourcesPath}/img/favicon.svg">
  <link rel="stylesheet" href="${url.resourcesPath}/css/login.css">
  <meta name="robots" content="noindex,nofollow">
</head>
<body class="ms-page">

  <nav class="ms-nav">
    <a href="${properties.appUrl!'http://localhost'}" class="ms-brand">
      <svg width="36" height="36" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#C2617A"/>
        <circle cx="50" cy="22" r="10" fill="white"/>
        <path d="M 50,79 C 33,71 19,62 19,51 C 19,42 26,38 33,41 C 38,43 45,48 50,52 C 55,48 62,43 67,41 C 74,38 81,42 81,51 C 81,62 67,71 50,79 Z" fill="white"/>
        <path d="M 50,69 C 44,65 38,61 38,56 C 38,52 41,50 44,52 C 46,53 49,55 50,57 C 51,55 54,53 56,52 C 59,50 62,52 62,56 C 62,61 56,65 50,69 Z" fill="#C47E2A"/>
      </svg>
      <div class="ms-brand-name">
        <span class="ms-brand-fr">Mama Salama</span>
        <span class="ms-brand-ar">ماما سلامة</span>
      </div>
    </a>
    <div class="ms-nav-links">
      <a href="${properties.appUrl!'http://localhost'}">${msg("navHome")}</a>
      <a href="${properties.appUrl!'http://localhost'}#about">${msg("navAbout")}</a>
    </div>
    <div class="ms-nav-actions">
      <#if realm.internationalizationEnabled && locale.supported?has_content>
        <div class="ms-locales">
          <#list locale.supported as l>
            <a href="${l.url}" class="ms-locale-btn<#if l.languageTag == locale.currentLanguageTag> active</#if>">${l.languageTag?upper_case}</a>
          </#list>
        </div>
      </#if>
      <#if realm.registrationAllowed>
        <a href="${url.registrationUrl}" class="ms-nav-cta">${msg("navRegister")}</a>
      </#if>
    </div>
  </nav>

  <main class="ms-main">
    <div class="ms-card">

      <div class="ms-card-header">
        <svg class="ms-logo-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="50" fill="#C2617A"/>
          <circle cx="50" cy="22" r="10" fill="white"/>
          <path d="M 50,79 C 33,71 19,62 19,51 C 19,42 26,38 33,41 C 38,43 45,48 50,52 C 55,48 62,43 67,41 C 74,38 81,42 81,51 C 81,62 67,71 50,79 Z" fill="white"/>
          <path d="M 50,69 C 44,65 38,61 38,56 C 38,52 41,50 44,52 C 46,53 49,55 50,57 C 51,55 54,53 56,52 C 59,50 62,52 62,56 C 62,61 56,65 50,69 Z" fill="#C47E2A"/>
        </svg>
        <h1 class="ms-card-title">${msg("loginTitle")}</h1>
        <p class="ms-card-subtitle">${msg("loginTitleHtml")}</p>
      </div>

      <div class="ms-card-divider"></div>

      <div class="ms-card-body">

        <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
          <div class="ms-alert ms-alert-${message.type}">
            <#if message.type == 'error'>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </#if>
            ${kcSanitize(message.summary)?no_esc}
          </div>
        </#if>

        <form id="kc-form-login" onsubmit="document.getElementById('kc-login').disabled=true;" action="${url.loginAction}" method="post">
          <#if csrf??><input type="hidden" name="${csrf.formFieldName}" value="${csrf.token}"></#if>

          <div class="ms-field">
            <label for="username">${msg("loginUsername")}</label>
            <input id="username" name="username" type="email"
                   value="${login.username!''}"
                   placeholder="votre@email.com"
                   autofocus autocomplete="email"
                   class="ms-input<#if messagesPerField.existsError('username','password')> ms-input-err</#if>">
          </div>

          <div class="ms-field">
            <label for="password">${msg("password")}</label>
            <div class="ms-pwd-wrap">
              <input id="password" name="password" type="password"
                     autocomplete="current-password"
                     class="ms-input<#if messagesPerField.existsError('username','password')> ms-input-err</#if>">
              <button type="button" class="ms-eye-btn" onclick="msTogglePwd('password',this)" tabindex="-1">
                <svg class="ms-eye-show" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                <svg class="ms-eye-hide" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="display:none">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                </svg>
              </button>
            </div>
          </div>

          <#if realm.resetPasswordAllowed>
            <div class="ms-forgot">
              <a href="${url.loginResetCredentialsUrl}" class="ms-link">${msg("doForgotPassword")}</a>
            </div>
          </#if>

          <button id="kc-login" type="submit" class="ms-btn-primary">${msg("doLogIn")}</button>
        </form>
      </div>

      <#if realm.registrationAllowed>
        <div class="ms-card-footer">
          <span>${msg("noAccount")}</span>
          <a href="${url.registrationUrl}" class="ms-link ms-link-bold">${msg("doRegister")}</a>
        </div>
      </#if>

    </div>
  </main>

  <script>
    function msTogglePwd(inputId, btn) {
      var input = document.getElementById(inputId);
      var show = btn.querySelector('.ms-eye-show');
      var hide = btn.querySelector('.ms-eye-hide');
      if (input.type === 'password') {
        input.type = 'text';
        show.style.display = 'none';
        hide.style.display = 'block';
      } else {
        input.type = 'password';
        show.style.display = 'block';
        hide.style.display = 'none';
      }
    }
  </script>
</body>
</html>
