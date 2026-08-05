package com.mamasalama.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendOtp(String toEmail, String code) {
        send(toEmail,
             "ماما سلامة | Code de vérification",
             buildHtml(code, "vérification", "رمز التحقق", false));
    }

    public void sendPasswordResetOtp(String toEmail, String code) {
        send(toEmail,
             "ماما سلامة | Réinitialisation du mot de passe",
             buildHtml(code, "réinitialisation du mot de passe", "إعادة تعيين كلمة المرور", true));
    }

    public void sendAlertClaimedNotification(String patientEmail, String doctorEmail) {

    public void sendDoctorInviteEmail(String doctorEmail, String firstName, String inviteLink) {
        String displayName = (firstName != null && !firstName.isBlank()) ? "Dr " + firstName : "Docteur";
        String html = """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background-color:#F7F3EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#F7F3EE;padding:40px 16px;">
                <tr><td align="center">
                  <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(194,97,122,0.10);">
                    <tr>
                      <td align="center" style="background:#ffffff;padding:28px 32px 20px;border-bottom:3px solid #C2617A;">
                        <img src="cid:mamasalama-logo" alt="Mama Salama" style="max-width:320px;width:100%%;height:auto;display:block;margin:0 auto;" />
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:36px 40px 32px;">
                        <h2 style="margin:0 0 4px;font-size:18px;color:#3D2B34;">Bienvenue sur Mama Salama</h2>
                        <p style="margin:0 0 20px;font-size:13px;color:#A08898;direction:rtl;">مرحباً بك في ماما سلامة</p>
                        <p style="margin:0 0 12px;font-size:15px;color:#5C4A50;line-height:1.7;">
                          Bonjour %s,<br><br>
                          Vous avez été invité(e) à rejoindre la plateforme Mama Salama en tant que médecin.
                          Cliquez sur le bouton ci-dessous pour créer votre compte. Ce lien est valable <strong>48 heures</strong>.
                        </p>
                        <p style="margin:0 0 28px;font-size:14px;color:#A08898;direction:rtl;line-height:1.7;">
                          تمت دعوتك للانضمام إلى منصة ماما سلامة كطبيب. انقر على الزر أدناه لإنشاء حسابك. هذا الرابط صالح لمدة 48 ساعة.
                        </p>
                        <table width="100%%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center">
                              <a href="%s" style="display:inline-block;background:#C2617A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;">
                                Créer mon compte · إنشاء حسابي
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:24px 0 0;font-size:12px;color:#A08898;text-align:center;">
                          Si le bouton ne fonctionne pas, copiez ce lien : <br>
                          <span style="color:#C2617A;word-break:break-all;">%s</span>
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="background:#F7F3EE;padding:20px 32px;border-top:1px solid #EDE8E3;">
                        <p style="margin:0;font-size:12px;color:#A08898;">© 2026 Mama Salama · رعاية الأمومة بالمغرب</p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(displayName, inviteLink, inviteLink);
        send(doctorEmail, "ماما سلامة | Invitation médecin", html);
    }

    public void sendDoctorTempPasswordEmail(String doctorEmail, String fullName, String tempPassword) {
        String html = buildInfoHtml(
                "Bienvenue sur Mama Salama",
                "مرحباً بك في ماما سلامة",
                "Bonjour Dr " + fullName + ", votre compte médecin a été créé. Mot de passe temporaire : <strong>" + tempPassword + "</strong>. Veuillez le changer après votre première connexion.",
                "مرحباً الدكتور " + fullName + "، تم إنشاء حسابك. كلمة المرور المؤقتة: <strong>" + tempPassword + "</strong>. يرجى تغييرها بعد تسجيل الدخول الأول.",
                "#C2617A");
        send(doctorEmail, "ماما سلامة | Compte médecin créé", html);
    }

    private void send(String toEmail, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(html, true);
            helper.addInline("mamasalama-logo", new ClassPathResource("templates/img.png"));
            mailSender.send(message);
            log.info("Email sent to {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send email", e);
        }
    }

    private String buildInfoHtml(String titleFr, String titleAr, String bodyFr, String bodyAr, String accentColor) {
        return """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background-color:#F7F3EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#F7F3EE;padding:40px 16px;">
                <tr><td align="center">
                  <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(194,97,122,0.10);">
                    <tr>
                      <td align="center" style="background:#ffffff;padding:28px 32px 20px;border-bottom:3px solid %s;">
                        <img src="cid:mamasalama-logo" alt="Mama Salama" style="max-width:320px;width:100%%;height:auto;display:block;margin:0 auto;" />
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:36px 40px 32px;">
                        <h2 style="margin:0 0 4px;font-size:18px;color:#3D2B34;">%s</h2>
                        <p style="margin:0 0 20px;font-size:13px;color:#A08898;direction:rtl;">%s</p>
                        <p style="margin:0 0 12px;font-size:15px;color:#5C4A50;line-height:1.7;">%s</p>
                        <p style="margin:0;font-size:14px;color:#A08898;direction:rtl;line-height:1.7;">%s</p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="background:#F7F3EE;padding:20px 32px;border-top:1px solid #EDE8E3;">
                        <p style="margin:0;font-size:12px;color:#A08898;">© 2026 Mama Salama · رعاية الأمومة بالمغرب</p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(accentColor, titleFr, titleAr, bodyFr, bodyAr);
    }

    private String buildHtml(String code, String purposeFr, String purposeAr, boolean isReset) {
        String accentColor = isReset ? "#C47E2A" : "#C2617A";
        String accentLight = isReset ? "#FDF3E3" : "#FAF0F2";

        return """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background-color:#F7F3EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#F7F3EE;padding:40px 16px;">
                <tr><td align="center">
                  <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(194,97,122,0.10);">

                    <!-- HEADER -->
                    <tr>
                      <td align="center" style="background:#ffffff;padding:28px 32px 20px;border-bottom:3px solid #C2617A;">
                        <img src="cid:mamasalama-logo"
                             alt="Mama Salama | ماما سلامة"
                             style="max-width:320px;width:100%%;height:auto;display:block;margin:0 auto;" />
                      </td>
                    </tr>

                    <!-- BODY -->
                    <tr>
                      <td style="padding:36px 40px 16px;">
                        <p style="margin:0 0 8px;font-size:15px;color:#5C4A50;">Bonjour / مرحباً،</p>
                        <p style="margin:0 0 28px;font-size:15px;color:#5C4A50;line-height:1.6;">
                          Voici votre code de <strong>%s</strong> :<br>
                          <span style="direction:rtl;display:block;margin-top:4px;color:#A08898;font-size:14px;">رمز %s الخاص بك :</span>
                        </p>

                        <!-- OTP BOX -->
                        <table width="100%%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="background:%s;border-radius:12px;padding:28px 20px;">
                              <div style="font-size:42px;font-weight:700;letter-spacing:16px;color:%s;font-family:'Courier New',monospace;">
                                %s
                              </div>
                            </td>
                          </tr>
                        </table>

                        <p style="margin:24px 0 8px;font-size:13px;color:#A08898;text-align:center;">
                          ⏱ Valable pendant <strong>10 minutes</strong> — صالح لمدة 10 دقائق
                        </p>
                      </td>
                    </tr>

                    <!-- WARNING -->
                    <tr>
                      <td style="padding:8px 40px 32px;">
                        <table width="100%%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="background:#FAF0F2;border-left:3px solid #C2617A;border-radius:0 8px 8px 0;padding:12px 16px;">
                              <p style="margin:0;font-size:12px;color:#A08898;line-height:1.6;">
                                Si vous n'avez pas demandé ce code, ignorez cet e-mail.<br>
                                <span style="direction:rtl;display:block;margin-top:2px;">إذا لم تطلبي هذا الرمز، تجاهلي هذه الرسالة.</span>
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                      <td align="center" style="background:#F7F3EE;padding:20px 32px;border-top:1px solid #EDE8E3;">
                        <p style="margin:0;font-size:12px;color:#A08898;">
                          © 2026 Mama Salama · رعاية الأمومة بالمغرب
                        </p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(purposeFr, purposeAr, accentLight, accentColor, code);
    }
}