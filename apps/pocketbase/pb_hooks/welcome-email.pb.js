/// <reference path="../pb_data/types.d.ts" />

// Send a welcome email when a new user signs up.
// Respects the user's language preference (en/fr).

onRecordAfterCreateSuccess((e) => {
  const lang = e.record.get("language") || "en";
  const name = e.record.get("full_name") || e.record.get("name") || "";
  const recipient = e.record.get("email");

  const appUrl = $app.settings().meta.appUrl || "https://testnia.com";

  const subjects = { en: "Welcome to Testnia!", fr: "Bienvenue sur Testnia !" };
  const greetings = { en: `Hi ${name || "there"},`, fr: `Bonjour ${name || ""},` };
  const bodies = {
    en: "Your Testnia account is live. Start your exam preparation today by completing onboarding and generating your personalised AI study plan.",
    fr: "Votre compte Testnia est actif. Commencez votre préparation aux examens dès aujourd'hui en complétant l'intégration et en générant votre plan d'étude IA personnalisé.",
  };
  const ctas = { en: "Go to Dashboard", fr: "Aller au tableau de bord" };

  const subject = subjects[lang] || subjects.en;
  const greeting = greetings[lang] || greetings.en;
  const body = bodies[lang] || bodies.en;
  const cta = ctas[lang] || ctas.en;

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <img src="${appUrl}/favicon.ico" alt="Testnia" style="height:40px;margin-bottom:16px" />
      <h1 style="font-size:22px;font-weight:700;color:#0f2333;margin:0 0 8px">${subject}</h1>
      <p style="color:#555;margin:0 0 16px">${greeting}</p>
      <p style="color:#555;margin:0 0 24px">${body}</p>
      <a href="${appUrl}/dashboard" style="display:inline-block;background:#0077cc;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:600">${cta}</a>
      <p style="color:#aaa;font-size:12px;margin-top:32px">Testnia · exam preparation platform</p>
    </div>
  `;

  const message = new MailerMessage({
    from: { name: "Testnia" },
    to: [{ address: recipient }],
    subject,
    html,
  });

  try {
    $app.newMailClient().send(message);
  } catch (err) {
    $app.logger().error("welcome email failed", "to", recipient, "err", String(err));
  }

  e.next();
}, "users");
