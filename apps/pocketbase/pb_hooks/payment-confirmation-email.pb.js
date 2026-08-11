/// <reference path="../pb_data/types.d.ts" />

// Send a payment confirmation email when a subscription is upgraded to pro/premium.
onRecordAfterUpdateSuccess((e) => {
  try {
    const plan = e.record.get("plan");
    const status = e.record.get("status");

    // Only fire when subscription is activated as pro/premium
    if ((plan !== "pro" && plan !== "starter" && plan !== "tutor") || status !== "active") {
      e.next();
      return;
    }

    const userId = e.record.get("user");
    let user;
    try {
      user = $app.findRecordById("users", userId);
    } catch (_) {
      e.next();
      return;
    }

    const lang = user.get("language") || "en";
    const name = user.get("full_name") || user.get("name") || "";
    const email = user.get("email");
    const appUrl = $app.settings().meta.appUrl || "https://testnia.com";

    const subjects = {
      en: "Your Testnia Premium subscription is active",
      fr: "Votre abonnement Testnia Premium est actif",
    };
    const greetings = {
      en: `Hi ${name || "there"},`,
      fr: `Bonjour ${name || ""},`,
    };
    const bodies = {
      en: "Your payment was successful. You now have full Premium access for 30 days — unlimited practice, essay submissions, leaderboard access, and an ad-free experience.",
      fr: "Votre paiement a été effectué avec succès. Vous avez maintenant un accès Premium complet pour 30 jours — pratique illimitée, soumissions de dissertations, accès au classement et une expérience sans publicité.",
    };
    const ctas = {
      en: "Start practising",
      fr: "Commencer à pratiquer",
    };

    const subject = subjects[lang] || subjects.en;
    const greeting = greetings[lang] || greetings.en;
    const body = bodies[lang] || bodies.en;
    const cta = ctas[lang] || ctas.en;

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h1 style="font-size:22px;font-weight:700;color:#0f2333;margin:0 0 8px">${subject}</h1>
        <p style="color:#555;margin:0 0 16px">${greeting}</p>
        <p style="color:#555;margin:0 0 24px">${body}</p>
        <a href="${appUrl}/dashboard" style="display:inline-block;background:#0077cc;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:600">${cta}</a>
        <p style="color:#aaa;font-size:12px;margin-top:32px">Testnia · exam preparation platform</p>
      </div>
    `;

    const message = new MailerMessage({
      from: { name: "Testnia" },
      to: [{ address: email }],
      subject,
      html,
    });

    try {
      $app.newMailClient().send(message);
    } catch (err) {
      $app.logger().error("payment confirmation email failed", "to", email, "err", String(err));
    }
  } catch (err) {
    $app.logger().error("payment-confirmation-email hook error", "err", String(err));
  }

  e.next();
}, "subscriptions");
