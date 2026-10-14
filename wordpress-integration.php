<?php
/**
 * Plugin Name: Accuvision LASIK Candidacy Quiz
 * Description: Clean, responsive multi-step quiz for LASIK screening with 5 clinical decision triggers and lead capture.
 * Version: 1.0.0
 * Author: Accuvision
 * Text Domain: accuvision-quiz
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Accuvision_LASIK_Quiz {

    public function __construct() {
        // Register shortcode [accuvision_lasik_quiz]
        add_shortcode('accuvision_lasik_quiz', [$this, 'render_quiz_shortcode']);

        // Register AJAX handlers for logged-in and guest users
        add_action('wp_ajax_accuvision_quiz_submission', [$this, 'handle_quiz_submission']);
        add_action('wp_ajax_nopriv_accuvision_quiz_submission', [$this, 'handle_quiz_submission']);

        // Register custom post type to store leads in WP Admin (optional but highly practical)
        add_action('init', [$this, 'register_quiz_leads_cpt']);
    }

    /**
     * Render the quiz shortcode [accuvision_lasik_quiz]
     */
    public function render_quiz_shortcode($atts = []) {
        // Enqueue styles and scripts
        $plugin_url = plugin_dir_url(__FILE__);
        wp_enqueue_style('accuvision-quiz-css', $plugin_url . 'lasik-quiz.css', [], '1.0.0');
        wp_enqueue_script('accuvision-quiz-js', $plugin_url . 'lasik-quiz.js', [], '1.0.0', true);

        // Pass ajax_url and nonce to front-end script
        wp_localize_script('accuvision-quiz-js', 'accuvision_ajax_obj', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce'    => wp_create_nonce('accuvision_quiz_nonce')
        ]);

        // Capture HTML markup from template
        ob_start();
        $this->render_form_html();
        return ob_get_clean();
    }

    /**
     * Store submission and send notification email
     */
    public function handle_quiz_submission() {
        check_ajax_referer('accuvision_quiz_nonce', 'nonce');

        $first_name = isset($_POST['first_name']) ? sanitize_text_field($_POST['first_name']) : '';
        $last_name  = isset($_POST['last_name']) ? sanitize_text_field($_POST['last_name']) : '';
        $email      = isset($_POST['email']) ? sanitize_email($_POST['email']) : '';
        $phone      = isset($_POST['phone']) ? sanitize_text_field($_POST['phone']) : '';
        $notes      = isset($_POST['notes']) ? sanitize_textarea_field($_POST['notes']) : '';

        $outcome_status = isset($_POST['outcome_status']) ? sanitize_text_field($_POST['outcome_status']) : 'unknown';
        $outcome_id     = isset($_POST['outcome_id']) ? sanitize_text_field($_POST['outcome_id']) : '';

        // Form answers
        $pregnancy       = isset($_POST['pregnant']) ? sanitize_text_field($_POST['pregnant']) : '';
        $accutane        = isset($_POST['accutane']) ? sanitize_text_field($_POST['accutane']) : '';
        $prev_surgery    = isset($_POST['previous_surgery']) ? sanitize_text_field($_POST['previous_surgery']) : '';
        $concern         = isset($_POST['primary_concern']) ? sanitize_text_field($_POST['primary_concern']) : '';
        $conditions      = isset($_POST['conditions']) ? array_map('sanitize_text_field', (array)$_POST['conditions']) : [];
        $vision_corr     = isset($_POST['vision_correction']) ? array_map('sanitize_text_field', (array)$_POST['vision_correction']) : [];

        // Save lead in WordPress database
        $post_id = wp_insert_post([
            'post_type'   => 'lasik_quiz_lead',
            'post_title'  => sprintf('%s %s - %s (%s)', $first_name, $last_name, ucfirst($outcome_status), date('Y-m-d H:i')),
            'post_status' => 'publish'
        ]);

        if ($post_id && !is_wp_error($post_id)) {
            update_post_meta($post_id, '_lead_first_name', $first_name);
            update_post_meta($post_id, '_lead_last_name', $last_name);
            update_post_meta($post_id, '_lead_email', $email);
            update_post_meta($post_id, '_lead_phone', $phone);
            update_post_meta($post_id, '_lead_notes', $notes);
            update_post_meta($post_id, '_lead_outcome_status', $outcome_status);
            update_post_meta($post_id, '_lead_outcome_id', $outcome_id);
            update_post_meta($post_id, '_lead_answers', [
                'pregnancy'         => $pregnancy,
                'accutane'          => $accutane,
                'previous_surgery'  => $prev_surgery,
                'primary_concern'   => $concern,
                'conditions'        => $conditions,
                'vision_correction' => $vision_corr
            ]);
        }

        // Email Admin notification
        $admin_email = get_option('admin_email');
        $subject     = sprintf('[Accuvision LASIK Quiz] New Lead: %s %s (%s)', $first_name, $last_name, strtoupper($outcome_status));
        $body        = sprintf(
            "New LASIK Quiz Submission:\n\n" .
            "Name: %s %s\n" .
            "Email: %s\n" .
            "Phone: %s\n" .
            "Status: %s (Trigger ID: %s)\n\n" .
            "Answers Summary:\n" .
            "- Pregnant/Nursing: %s\n" .
            "- Accutane: %s\n" .
            "- Prior Surgery: %s\n" .
            "- Primary Concern: %s\n" .
            "- Medical Conditions: %s\n" .
            "- Vision Correction: %s\n\n" .
            "Notes:\n%s\n",
            $first_name,
            $last_name,
            $email,
            $phone,
            strtoupper($outcome_status),
            $outcome_id,
            $pregnancy,
            $accutane,
            $prev_surgery,
            $concern,
            implode(', ', $conditions),
            implode(', ', $vision_corr),
            $notes
        );

        wp_mail($admin_email, $subject, $body);

        wp_send_json_success([
            'message' => 'Submission saved successfully',
            'lead_id' => $post_id
        ]);
    }

    /**
     * Register Custom Post Type for Leads
     */
    public function register_quiz_leads_cpt() {
        register_post_type('lasik_quiz_lead', [
            'labels' => [
                'name'               => 'LASIK Quiz Leads',
                'singular_name'      => 'Quiz Lead',
                'menu_name'          => 'LASIK Leads',
                'all_items'          => 'All Leads',
                'view_item'          => 'View Lead'
            ],
            'public'       => false,
            'show_ui'      => true,
            'show_in_menu' => true,
            'menu_icon'    => 'dashicons-visibility',
            'supports'     => ['title']
        ]);
    }

    /**
     * Render the form HTML structure
     */
    private function render_form_html() {
        ?>
        <div class="accu-quiz-wrapper">
          <div class="accu-quiz-card">
            
            <div class="accu-quiz-header">
              <span class="accu-quiz-badge">Accuvision Eye Center</span>
              <h2 class="accu-quiz-title">LASIK Candidacy Self-Screening</h2>
              <p class="accu-quiz-subtitle">Take this quick 60-second quiz to find out if you qualify for LASIK vision correction.</p>
            </div>

            <div class="accu-quiz-progress-section" id="accuProgressSection">
              <div class="accu-quiz-progress-info">
                <span>Step <span id="accuCurrentStepNum">1</span> of <span id="accuTotalStepNum">6</span></span>
                <span class="accu-quiz-progress-pct">Quick Screening</span>
              </div>
              <div class="accu-quiz-progress-track">
                <div class="accu-quiz-progress-fill" id="accuProgressFill"></div>
              </div>
            </div>

            <form id="accuQuizForm" method="POST" action="" novalidate>
              
              <!-- STEP 1: VISION CORRECTION -->
              <div class="accu-quiz-step active" data-step="1">
                <h3 class="accu-step-question">1. What type of vision correction do you currently use?</h3>
                <p class="accu-step-hint">Select all that apply to you:</p>
                <div class="accu-options-grid" style="margin-bottom: 24px;">
                  <label class="accu-option-label">
                    <input type="checkbox" name="vision_correction[]" value="distance_glasses" class="accu-option-input">
                    <span class="accu-option-text">Distance Glasses <span class="accu-option-desc">Glasses for distance vision</span></span>
                  </label>
                  <label class="accu-option-label">
                    <input type="checkbox" name="vision_correction[]" value="bifocals" class="accu-option-input">
                    <span class="accu-option-text">Bifocals or Progressives <span class="accu-option-desc">Multifocal lenses for distance and near vision</span></span>
                  </label>
                  <label class="accu-option-label">
                    <input type="checkbox" name="vision_correction[]" value="contacts" class="accu-option-input">
                    <span class="accu-option-text">Contact Lenses <span class="accu-option-desc">Soft or hard contact lenses</span></span>
                  </label>
                  <label class="accu-option-label">
                    <input type="checkbox" name="vision_correction[]" value="readers" class="accu-option-input">
                    <span class="accu-option-text">Reading Glasses / Readers Only <span class="accu-option-desc">Used strictly for close-up reading</span></span>
                  </label>
                  <label class="accu-option-label">
                    <input type="checkbox" name="vision_correction[]" value="none" class="accu-option-input">
                    <span class="accu-option-text">I don't wear glasses or contact lenses <span class="accu-option-desc">No corrective eyewear used</span></span>
                  </label>
                </div>

                <h3 class="accu-step-question">What is your primary visual concern?</h3>
                <p class="accu-step-hint">Select your primary concern:</p>
                <div class="accu-options-grid">
                  <label class="accu-option-label">
                    <input type="radio" name="primary_concern" value="distance" class="accu-option-input">
                    <span class="accu-option-text">Trouble seeing things far away (Distance)</span>
                  </label>
                  <label class="accu-option-label">
                    <input type="radio" name="primary_concern" value="both" class="accu-option-input">
                    <span class="accu-option-text">Trouble seeing both near and far away</span>
                  </label>
                  <label class="accu-option-label">
                    <input type="radio" name="primary_concern" value="up_close_reading" class="accu-option-input">
                    <span class="accu-option-text">Trouble seeing up close / Trouble with Reading Only</span>
                  </label>
                  <label class="accu-option-label">
                    <input type="radio" name="primary_concern" value="astigmatism" class="accu-option-input">
                    <span class="accu-option-text">Astigmatism or blurry vision at all distances</span>
                  </label>
                </div>
                <div class="accu-error-msg"></div>
              </div>

              <!-- STEP 2: PREVIOUS SURGERY -->
              <div class="accu-quiz-step" data-step="2">
                <h3 class="accu-step-question">2. Have you previously had laser eye surgery?</h3>
                <p class="accu-step-hint">This helps us evaluate eligibility for enhancements or retreatments.</p>
                <div class="accu-options-grid">
                  <label class="accu-option-label">
                    <input type="radio" name="previous_surgery" value="no" class="accu-option-input">
                    <span class="accu-option-text">No, I have never had laser eye surgery</span>
                  </label>
                  <label class="accu-option-label">
                    <input type="radio" name="previous_surgery" value="yes" class="accu-option-input">
                    <span class="accu-option-text">Yes, I have previously had LASIK or PRK</span>
                  </label>
                </div>
                <div class="accu-error-msg"></div>
              </div>

              <!-- STEP 3: MEDICAL CONDITIONS -->
              <div class="accu-quiz-step" data-step="3">
                <h3 class="accu-step-question">3. Medical History &amp; Eye Health</h3>
                <p class="accu-step-hint">Have you ever been diagnosed with or treated for any of the following?</p>
                <div class="accu-options-grid">
                  <label class="accu-option-label">
                    <input type="checkbox" name="conditions[]" value="cataracts" class="accu-option-input">
                    <span class="accu-option-text">Cataracts</span>
                  </label>
                  <label class="accu-option-label">
                    <input type="checkbox" name="conditions[]" value="keratoconus" class="accu-option-input">
                    <span class="accu-option-text">Keratoconus</span>
                  </label>
                  <label class="accu-option-label">
                    <input type="checkbox" name="conditions[]" value="macular_degeneration" class="accu-option-input">
                    <span class="accu-option-text">Macular Degeneration</span>
                  </label>
                  <label class="accu-option-label">
                    <input type="checkbox" name="conditions[]" value="fuchs_dystrophy" class="accu-option-input">
                    <span class="accu-option-text">Fuchs' Dystrophy</span>
                  </label>
                  <label class="accu-option-label">
                    <input type="checkbox" name="conditions[]" value="herpes_eye_infection" class="accu-option-input">
                    <span class="accu-option-text">Herpes Eye Infection (Ocular Herpes)</span>
                  </label>
                  <label class="accu-option-label">
                    <input type="checkbox" name="conditions[]" value="pacemaker" class="accu-option-input">
                    <span class="accu-option-text">Pacemaker</span>
                  </label>
                  <label class="accu-option-label">
                    <input type="checkbox" name="conditions[]" value="none" class="accu-option-input">
                    <span class="accu-option-text">None of the above</span>
                  </label>
                </div>
                <div class="accu-error-msg"></div>
              </div>

              <!-- STEP 4: ACCUTANE -->
              <div class="accu-quiz-step" data-step="4">
                <h3 class="accu-step-question">4. Current Medication Screening</h3>
                <p class="accu-step-hint">Certain medications can impact corneal healing and tear production.</p>
                <div class="accu-options-grid">
                  <p style="font-weight: 600; color: #1e293b; margin: 0 0 10px 0;">Are you currently taking Accutane (isotretinoin)?</p>
                  <label class="accu-option-label">
                    <input type="radio" name="accutane" value="no" class="accu-option-input">
                    <span class="accu-option-text">No, I do not take Accutane</span>
                  </label>
                  <label class="accu-option-label">
                    <input type="radio" name="accutane" value="yes" class="accu-option-input">
                    <span class="accu-option-text">Yes, I am currently taking Accutane</span>
                  </label>
                </div>
                <div class="accu-error-msg"></div>
              </div>

              <!-- STEP 5: PREGNANCY -->
              <div class="accu-quiz-step" data-step="5">
                <h3 class="accu-step-question">5. Pregnancy &amp; Nursing Status</h3>
                <p class="accu-step-hint">Hormonal changes temporarily alter corneal shape and thickness.</p>
                <div class="accu-options-grid">
                  <p style="font-weight: 600; color: #1e293b; margin: 0 0 10px 0;">Are you currently pregnant or nursing?</p>
                  <label class="accu-option-label">
                    <input type="radio" name="pregnant" value="no" class="accu-option-input">
                    <span class="accu-option-text">No</span>
                  </label>
                  <label class="accu-option-label">
                    <input type="radio" name="pregnant" value="yes" class="accu-option-input">
                    <span class="accu-option-text">Yes, I am currently pregnant or nursing</span>
                  </label>
                  <label class="accu-option-label">
                    <input type="radio" name="pregnant" value="na" class="accu-option-input">
                    <span class="accu-option-text">Not Applicable</span>
                  </label>
                </div>
                <div class="accu-error-msg"></div>
              </div>

              <!-- STEP 6: CONTACT INFORMATION -->
              <div class="accu-quiz-step" data-step="6">
                <h3 class="accu-step-question">6. Where should we send your screening results?</h3>
                <p class="accu-step-hint">Please provide your contact details to review your customized LASIK candidacy report.</p>
                <div class="accu-form-row">
                  <div class="accu-form-group">
                    <label class="accu-label">First Name *</label>
                    <input type="text" name="first_name" class="accu-input" placeholder="e.g. John" required>
                  </div>
                  <div class="accu-form-group">
                    <label class="accu-label">Last Name *</label>
                    <input type="text" name="last_name" class="accu-input" placeholder="e.g. Smith" required>
                  </div>
                </div>
                <div class="accu-form-row">
                  <div class="accu-form-group">
                    <label class="accu-label">Email Address *</label>
                    <input type="email" name="email" class="accu-input" placeholder="john.smith@example.com" required>
                  </div>
                  <div class="accu-form-group">
                    <label class="accu-label">Phone Number *</label>
                    <input type="tel" name="phone" class="accu-input" placeholder="(555) 000-0000" required>
                  </div>
                </div>
                <div class="accu-form-group">
                  <label class="accu-label">Additional Questions or Notes (Optional)</label>
                  <textarea name="notes" rows="3" class="accu-textarea" placeholder="Tell us about any specific vision goals or questions..."></textarea>
                </div>
                <div class="accu-error-msg"></div>
              </div>

              <!-- STEP 7: OUTCOME / RESULTS -->
              <div class="accu-quiz-step" data-step="7">
                <div id="accuResultContainer"></div>
                <div style="text-align: center;">
                  <button type="button" class="accu-restart-link" id="accuRestartBtn">↺ Retake Screening Quiz</button>
                </div>
              </div>

              <!-- CONTROLS -->
              <div class="accu-quiz-actions">
                <button type="button" class="accu-btn accu-btn-secondary" id="accuBtnPrev" style="display: none;">
                  ← Back
                </button>
                <button type="button" class="accu-btn accu-btn-primary" id="accuBtnNext">
                  Next Step →
                </button>
                <button type="submit" class="accu-btn accu-btn-primary" id="accuBtnSubmit" style="display: none;">
                  Submit &amp; See Results ➔
                </button>
              </div>

            </form>

            <div class="accu-wp-notice">
              🔒 Your information is confidential and protected by standard medical privacy practices.
            </div>

          </div>
        </div>
        <?php
    }
}

new Accuvision_LASIK_Quiz();
