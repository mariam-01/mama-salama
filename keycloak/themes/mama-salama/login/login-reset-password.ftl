<!DOCTYPE html>
<html lang="${locale.currentLanguageTag}"<#if locale.currentLanguageTag == "ar"> dir="rtl"</#if>>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${msg("emailForgotTitle")} — Mama Salama</title>
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
        <h1 class="ms-card-title">${msg("emailForgotTitle")}</h1>
        <p class="ms-card-subtitle">${msg("forgotSubtitle")}</p>
      </div>

      <div class="ms-card-body">

        <#if message?has_content>
          <div class="ms-alert ms-alert-${message.type}">
            ${kcSanitize(message.summary)?no_esc}
          </div>
        </#if>

        <form action="${url.loginAction}" method="post">
          <#if csrf??><input type="hidden" name="${csrf.formFieldName}" value="${csrf.token}"></#if>

          <div class="ms-field">
            <label for="username">${msg("loginUsername")}</label>
            <input id="username" name="username" type="email"
                   value="${auth.attemptedUsername!''}"
                   placeholder="votre@email.com"
                   autofocus autocomplete="email"
                   class="ms-input">
          </div>

          <button type="submit" class="ms-btn-primary">${msg("doSendLink")}</button>
        </form>
      </div>

      <div class="ms-card-footer">
        <a href="${url.loginUrl}" class="ms-link">${msg("backToLogin")}</a>
      </div>

    </div>
  </main>

</body>
</html>
