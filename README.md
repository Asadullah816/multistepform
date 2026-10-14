# Accuvision LASIK Candidacy Multi-Step Quiz

A clean, responsive, multi-step self-screening quiz built with HTML, scoped CSS, and vanilla JavaScript. It is designed to work standalone in any web browser and seamlessly within **WordPress** (Gutenberg, Elementor, shortcode, or custom plugin).

---

## 🎯 Clinical Screening Logic & Triggers

The quiz evaluates candidate responses against the required 5 clinical screening rules:

| # | Trigger Condition | Outcome | Clinical Message |
|---|---|---|---|
| **1** | Currently pregnant or nursing (`pregnant = "yes"`) | Ineligible | *"Thank you for your interest in Accuvision LASIK! You’re not eligible for LASIK while pregnant or nursing. Please check back after your baby is born and at least three months after you’ve stopped nursing. We’d love to help you explore your options then!"* |
| **2** | Previous LASIK or PRK (`previous_surgery = "yes"`) | Flag for Review | *"If you’ve previously had LASIK or PRK, an additional evaluation is needed to determine whether another procedure is appropriate. Not all patients can safely qualify for a retreatment. Please contact our team to discuss your options."* |
| **3** | Readers as only correction, "I don't wear glasses or contacts", or trouble up close/reading only | Screening criteria not met | *"Based on your answers, you do not meet Accuvision LASIK’s screening criteria for treatment. We understand this may be disappointing. Please contact our team if you have questions about your results or would like guidance on your next step."* |
| **4** | Medical conditions: Cataracts, keratoconus, macular degeneration, Fuchs' dystrophy, herpes eye infection, or pacemaker | Screening criteria not met | *"Based on the medical history you selected, you do not meet Accuvision LASIK’s screening criteria for treatment. Your eye health and safety are our priority. We encourage you to speak with your eye doctor about options suited to your individual needs."* |
| **5** | Currently taking Accutane (`accutane = "yes"`) | Screening criteria not met | *"You do not meet Accuvision LASIK’s screening criteria while taking Accutane. Please contact our team with any questions about future eligibility. Do not stop or change your medication to qualify for LASIK without speaking with your prescribing doctor."* |
| **✓** | None of the above triggers | **Qualified** | Shows positive candidacy confirmation and direct booking/call CTAs. |

---

## 📁 File Structure

- [`index.html`](file:///d:/Programming/Wordpress/Multistepform/index.html): Standalone HTML demo and preview.
- [`lasik-quiz.css`](file:///d:/Programming/Wordpress/Multistepform/lasik-quiz.css): Scoped styles (`.accu-quiz-*`) to avoid CSS conflicts with any WordPress theme.
- [`lasik-quiz.js`](file:///d:/Programming/Wordpress/Multistepform/lasik-quiz.js): Form step navigation, validation, trigger calculation, and WordPress AJAX/REST submission.
- [`wordpress-integration.php`](file:///d:/Programming/Wordpress/Multistepform/wordpress-integration.php): Ready-to-use WordPress plugin / functions snippet with `[accuvision_lasik_quiz]` shortcode, lead capture CPT, and admin email notifications.

---

## 🚀 How to Use in WordPress

### Method 1: As a WordPress Plugin (Recommended)
1. Copy the `Multistepform` folder to `wp-content/plugins/accuvision-lasik-quiz`.
2. Rename `wordpress-integration.php` to `accuvision-lasik-quiz.php` (or keep it as is).
3. In WordPress Admin, go to **Plugins** and activate **Accuvision LASIK Candidacy Quiz**.
4. Place the shortcode `[accuvision_lasik_quiz]` anywhere on any page, post, or Elementor shortcode widget.
5. All leads will automatically be saved under **LASIK Leads** in WordPress Admin and emailed to the site administrator.

### Method 2: Elementor or Gutenberg Custom HTML Block
1. Copy the `<style>` content from [`lasik-quiz.css`](file:///d:/Programming/Wordpress/Multistepform/lasik-quiz.css).
2. Copy the `<div class="accu-quiz-wrapper">...</div>` markup from [`index.html`](file:///d:/Programming/Wordpress/Multistepform/index.html).
3. Copy the `<script>` code from [`lasik-quiz.js`](file:///d:/Programming/Wordpress/Multistepform/lasik-quiz.js).
4. Paste them into an **HTML** widget / block in any WordPress page editor.

---

## 🧪 Testing the Form Standalone
Simply open [`index.html`](file:///d:/Programming/Wordpress/Multistepform/index.html) in your browser. All steps, validations, and trigger evaluations work immediately without requiring any local server or build tools.
