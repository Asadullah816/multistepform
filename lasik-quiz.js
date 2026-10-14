/**
 * Accuvision LASIK Candidacy Quiz - Multi-step Logic & WordPress Integration
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const quizForm = document.getElementById('accuQuizForm');
    if (!quizForm) return;

    // Elements
    const steps = Array.from(quizForm.querySelectorAll('.accu-quiz-step'));
    const totalQuestionSteps = 6; // Steps 1-6 are input steps, Step 7 is result
    const progressFill = document.getElementById('accuProgressFill');
    const progressCurrent = document.getElementById('accuCurrentStepNum');
    const progressTotal = document.getElementById('accuTotalStepNum');
    const progressSection = document.getElementById('accuProgressSection');
    const btnPrev = document.getElementById('accuBtnPrev');
    const btnNext = document.getElementById('accuBtnNext');
    const btnSubmit = document.getElementById('accuBtnSubmit');
    const resultContainer = document.getElementById('accuResultContainer');
    const restartBtn = document.getElementById('accuRestartBtn');

    let currentStep = 1;

    // Trigger Response Messages (Exact Clinical Texts Required)
    const RESPONSES = {
      pregnancy: {
        id: 'pregnancy',
        status: 'disqualified',
        tag: 'Ineligible at this time',
        title: 'Pregnancy or Nursing Notice',
        message:
          'Thank you for your interest in Accuvision LASIK! You’re not eligible for LASIK while pregnant or nursing. Please check back after your baby is born and at least three months after you’ve stopped nursing. We’d love to help you explore your options then!'
      },
      previousSurgery: {
        id: 'previous_surgery',
        status: 'flagged',
        tag: 'Evaluation Needed',
        title: 'Previous LASIK or PRK Review',
        message:
          'If you’ve previously had LASIK or PRK, an additional evaluation is needed to determine whether another procedure is appropriate. Not all patients can safely qualify for a retreatment. Please contact our team to discuss your options.'
      },
      visionCorrection: {
        id: 'vision_near_correction',
        status: 'disqualified',
        tag: 'Screening Criteria',
        title: 'Screening Criteria Not Met',
        message:
          'Based on your answers, you do not meet Accuvision LASIK’s screening criteria for treatment. We understand this may be disappointing. Please contact our team if you have questions about your results or would like guidance on your next step.'
      },
      medicalConditions: {
        id: 'medical_conditions',
        status: 'disqualified',
        tag: 'Medical History',
        title: 'Screening Criteria Not Met',
        message:
          'Based on the medical history you selected, you do not meet Accuvision LASIK’s screening criteria for treatment. Your eye health and safety are our priority. We encourage you to speak with your eye doctor about options suited to your individual needs.'
      },
      accutane: {
        id: 'accutane',
        status: 'disqualified',
        tag: 'Medication Notice',
        title: 'Accutane Medication Screening',
        message:
          'You do not meet Accuvision LASIK’s screening criteria while taking Accutane. Please contact our team with any questions about future eligibility. Do not stop or change your medication to qualify for LASIK without speaking with your prescribing doctor.'
      },
      qualified: {
        id: 'qualified',
        status: 'qualified',
        tag: 'Preliminary Qualified',
        title: 'Great News! You Are a Potential Candidate',
        message:
          'Based on your screening responses, you meet the initial candidacy criteria for Accuvision LASIK! Our clinical team would love to welcome you for a comprehensive examination to determine the safest and most effective vision correction plan for your eyes.'
      }
    };

    // Initialize UI
    function initQuiz() {
      if (progressTotal) progressTotal.textContent = totalQuestionSteps;
      bindInputEvents();
      bindNavEvents();
      updateStepView();
    }

    // Helper: Style selected labels on change
    function bindInputEvents() {
      quizForm.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', function () {
          const name = this.name;
          if (this.type === 'radio') {
            quizForm.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
              const label = radio.closest('.accu-option-label');
              if (label) label.classList.toggle('selected', radio.checked);
            });
          } else {
            const label = this.closest('.accu-option-label');
            if (label) label.classList.toggle('selected', this.checked);

            // Handle exclusive "None of the above" or "I don't wear glasses"
            if (this.name === 'conditions[]') {
              handleConditionExclusives(this);
            }
            if (this.name === 'vision_correction[]') {
              handleVisionExclusives(this);
            }
          }
          clearStepError(currentStep);
        });
      });
    }

    function handleConditionExclusives(clickedInput) {
      const noneInput = quizForm.querySelector('input[name="conditions[]"][value="none"]');
      const otherInputs = quizForm.querySelectorAll('input[name="conditions[]"]:not([value="none"])');

      if (clickedInput.value === 'none' && clickedInput.checked) {
        otherInputs.forEach(i => {
          i.checked = false;
          const lbl = i.closest('.accu-option-label');
          if (lbl) lbl.classList.remove('selected');
        });
      } else if (clickedInput.value !== 'none' && clickedInput.checked && noneInput) {
        noneInput.checked = false;
        const lbl = noneInput.closest('.accu-option-label');
        if (lbl) lbl.classList.remove('selected');
      }
    }

    function handleVisionExclusives(clickedInput) {
      const noGlassesInput = quizForm.querySelector('input[name="vision_correction[]"][value="none"]');
      const otherInputs = quizForm.querySelectorAll('input[name="vision_correction[]"]:not([value="none"])');

      if (clickedInput.value === 'none' && clickedInput.checked) {
        otherInputs.forEach(i => {
          i.checked = false;
          const lbl = i.closest('.accu-option-label');
          if (lbl) lbl.classList.remove('selected');
        });
      } else if (clickedInput.value !== 'none' && clickedInput.checked && noGlassesInput) {
        noGlassesInput.checked = false;
        const lbl = noGlassesInput.closest('.accu-option-label');
        if (lbl) lbl.classList.remove('selected');
      }
    }

    function bindNavEvents() {
      if (btnPrev) {
        btnPrev.addEventListener('click', function (e) {
          e.preventDefault();
          if (currentStep > 1) {
            currentStep--;
            updateStepView();
          }
        });
      }

      if (btnNext) {
        btnNext.addEventListener('click', function (e) {
          e.preventDefault();
          if (validateStep(currentStep)) {
            if (currentStep < totalQuestionSteps) {
              currentStep++;
              updateStepView();
            }
          }
        });
      }

      if (quizForm) {
        quizForm.addEventListener('submit', function (e) {
          e.preventDefault();
          if (validateStep(currentStep)) {
            handleFormSubmission();
          }
        });
      }

      if (restartBtn) {
        restartBtn.addEventListener('click', function (e) {
          e.preventDefault();
          resetQuiz();
        });
      }
    }

    function updateStepView() {
      // Show/Hide steps
      steps.forEach((step, idx) => {
        const stepNum = idx + 1;
        step.classList.toggle('active', stepNum === currentStep);
      });

      // Update progress bar
      if (currentStep <= totalQuestionSteps) {
        if (progressSection) progressSection.style.display = 'block';
        if (progressCurrent) progressCurrent.textContent = currentStep;
        const pct = ((currentStep) / totalQuestionSteps) * 100;
        if (progressFill) progressFill.style.width = pct + '%';

        // Nav button visibility
        if (btnPrev) btnPrev.style.display = currentStep > 1 ? 'inline-flex' : 'none';
        if (btnNext) btnNext.style.display = currentStep < totalQuestionSteps ? 'inline-flex' : 'none';
        if (btnSubmit) btnSubmit.style.display = currentStep === totalQuestionSteps ? 'inline-flex' : 'none';
      } else {
        // Result Step (Step 7)
        if (progressSection) progressSection.style.display = 'none';
        if (btnPrev) btnPrev.style.display = 'none';
        if (btnNext) btnNext.style.display = 'none';
        if (btnSubmit) btnSubmit.style.display = 'none';
      }

      // Scroll smoothly to top of card
      quizForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Step Validation
    function validateStep(stepNum) {
      clearStepError(stepNum);
      const stepElem = quizForm.querySelector(`.accu-quiz-step[data-step="${stepNum}"]`);
      if (!stepElem) return true;

      const errorMsg = stepElem.querySelector('.accu-error-msg');

      if (stepNum === 1) {
        const corrections = Array.from(stepElem.querySelectorAll('input[name="vision_correction[]"]:checked'));
        const concern = stepElem.querySelector('input[name="primary_concern"]:checked');
        if (corrections.length === 0 || !concern) {
          showError(errorMsg, 'Please select both your current vision correction and primary vision concern.');
          return false;
        }
      } else if (stepNum === 2) {
        const prevLasik = stepElem.querySelector('input[name="previous_surgery"]:checked');
        if (!prevLasik) {
          showError(errorMsg, 'Please answer whether you have had prior laser eye surgery.');
          return false;
        }
      } else if (stepNum === 3) {
        const conditions = Array.from(stepElem.querySelectorAll('input[name="conditions[]"]:checked'));
        if (conditions.length === 0) {
          showError(errorMsg, 'Please select any applicable conditions, or choose "None of the above".');
          return false;
        }
      } else if (stepNum === 4) {
        const accutane = stepElem.querySelector('input[name="accutane"]:checked');
        if (!accutane) {
          showError(errorMsg, 'Please indicate whether you are currently taking Accutane.');
          return false;
        }
      } else if (stepNum === 5) {
        const pregnant = stepElem.querySelector('input[name="pregnant"]:checked');
        if (!pregnant) {
          showError(errorMsg, 'Please answer the pregnancy and nursing question.');
          return false;
        }
      } else if (stepNum === 6) {
        // Contact details
        const firstName = quizForm.querySelector('input[name="first_name"]');
        const lastName = quizForm.querySelector('input[name="last_name"]');
        const email = quizForm.querySelector('input[name="email"]');
        const phone = quizForm.querySelector('input[name="phone"]');

        let isValid = true;
        if (!firstName || !firstName.value.trim()) {
          markInputError(firstName);
          isValid = false;
        }
        if (!lastName || !lastName.value.trim()) {
          markInputError(lastName);
          isValid = false;
        }
        if (!email || !isValidEmail(email.value.trim())) {
          markInputError(email);
          isValid = false;
        }
        if (!phone || !isValidPhone(phone.value.trim())) {
          markInputError(phone);
          isValid = false;
        }

        if (!isValid) {
          showError(errorMsg, 'Please fill in all required contact fields with valid information.');
          return false;
        }
      }

      return true;
    }

    function showError(element, msg) {
      if (element) {
        element.textContent = msg;
        element.classList.add('show');
      }
    }

    function clearStepError(stepNum) {
      const stepElem = quizForm.querySelector(`.accu-quiz-step[data-step="${stepNum}"]`);
      if (stepElem) {
        const errorMsg = stepElem.querySelector('.accu-error-msg');
        if (errorMsg) errorMsg.classList.remove('show');
        stepElem.querySelectorAll('.accu-input.error').forEach(input => input.classList.remove('error'));
      }
    }

    function markInputError(input) {
      if (input) {
        input.classList.add('error');
        input.addEventListener('input', function handler() {
          input.classList.remove('error');
          input.removeEventListener('input', handler);
        });
      }
    }

    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isValidPhone(phone) {
      // Basic 7-15 digit phone validation
      const digits = phone.replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 15;
    }

    /**
     * CANDIDACY EVALUATION ENGINE
     * Evaluates against the 5 clinical triggers specified:
     * 1. Pregnancy/Nursing -> Trigger 1
     * 2. Previous LASIK/PRK -> Trigger 2 (Flag for review)
     * 3. Vision correction: Readers only; "I don't wear glasses or contact lenses"; "Trouble seeing up close"; or "Trouble with Reading Only" -> Trigger 3
     * 4. Medical conditions: Cataracts, keratoconus, macular degeneration, Fuchs dystrophy, herpes eye infection, pacemaker -> Trigger 4
     * 5. Accutane: Yes -> Trigger 5
     */
    function evaluateCandidacy() {
      const answers = getFormAnswers();
      const triggeredResponses = [];

      // Trigger 1: Pregnancy or nursing
      if (answers.pregnant === 'yes') {
        triggeredResponses.push(RESPONSES.pregnancy);
      }

      // Trigger 5: Current Accutane use
      if (answers.accutane === 'yes') {
        triggeredResponses.push(RESPONSES.accutane);
      }

      // Trigger 4: Listed medical conditions
      const conditionTriggers = [
        'cataracts',
        'keratoconus',
        'macular_degeneration',
        'fuchs_dystrophy',
        'herpes_eye_infection',
        'pacemaker'
      ];
      const hasListedCondition = answers.conditions.some(c => conditionTriggers.includes(c));
      if (hasListedCondition) {
        triggeredResponses.push(RESPONSES.medicalConditions);
      }

      // Trigger 3: Vision correction and near vision responses
      // "Readers as the only correction selected; 'I don’t wear glasses or contact lenses'; 'Trouble seeing up close'; or 'Trouble with Reading Only'"
      const onlyReadersSelected =
        answers.visionCorrection.length === 1 && answers.visionCorrection[0] === 'readers';
      const noCorrectionSelected =
        answers.visionCorrection.includes('none') ||
        (answers.visionCorrection.length === 1 && answers.visionCorrection[0] === 'none');
      const troubleUpCloseOrReading =
        answers.primaryConcern === 'up_close_reading';

      if (onlyReadersSelected || noCorrectionSelected || troubleUpCloseOrReading) {
        triggeredResponses.push(RESPONSES.visionCorrection);
      }

      // Trigger 2: Previous LASIK or PRK (Flag for Review)
      if (answers.previousSurgery === 'yes') {
        triggeredResponses.push(RESPONSES.previousSurgery);
      }

      // Priority resolution:
      // If there are disqualifications (status: 'disqualified'), show the primary disqualification.
      // If none, but flagged for review (status: 'flagged'), show review message.
      // If neither, patient is qualified!
      const disqualification = triggeredResponses.find(r => r.status === 'disqualified');
      if (disqualification) {
        return disqualification;
      }

      const reviewFlag = triggeredResponses.find(r => r.status === 'flagged');
      if (reviewFlag) {
        return reviewFlag;
      }

      return RESPONSES.qualified;
    }

    function getFormAnswers() {
      const visionCorrection = Array.from(
        quizForm.querySelectorAll('input[name="vision_correction[]"]:checked')
      ).map(el => el.value);

      const concernEl = quizForm.querySelector('input[name="primary_concern"]:checked');
      const primaryConcern = concernEl ? concernEl.value : '';

      const surgeryEl = quizForm.querySelector('input[name="previous_surgery"]:checked');
      const previousSurgery = surgeryEl ? surgeryEl.value : '';

      const conditions = Array.from(
        quizForm.querySelectorAll('input[name="conditions[]"]:checked')
      ).map(el => el.value);

      const accutaneEl = quizForm.querySelector('input[name="accutane"]:checked');
      const accutane = accutaneEl ? accutaneEl.value : '';

      const pregnantEl = quizForm.querySelector('input[name="pregnant"]:checked');
      const pregnant = pregnantEl ? pregnantEl.value : '';

      const firstName = (quizForm.querySelector('input[name="first_name"]') || {}).value || '';
      const lastName = (quizForm.querySelector('input[name="last_name"]') || {}).value || '';
      const email = (quizForm.querySelector('input[name="email"]') || {}).value || '';
      const phone = (quizForm.querySelector('input[name="phone"]') || {}).value || '';
      const notes = (quizForm.querySelector('textarea[name="notes"]') || {}).value || '';

      return {
        visionCorrection,
        primaryConcern,
        previousSurgery,
        conditions,
        accutane,
        pregnant,
        firstName,
        lastName,
        email,
        phone,
        notes
      };
    }

    /**
     * Submission Handler (Works with WordPress or Standalone)
     */
    function handleFormSubmission() {
      const finalResult = evaluateCandidacy();
      const answers = getFormAnswers();

      // Show loading spinner
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="accu-spinner"></span> Submitting...';
      }

      // Hidden fields update so standard POST carries the evaluated outcome
      setHiddenField('quiz_outcome_status', finalResult.status);
      setHiddenField('quiz_outcome_id', finalResult.id);
      setHiddenField('quiz_outcome_message', finalResult.message);

      // Check if WordPress AJAX or custom endpoint is configured
      const isWpAjax = typeof window.accuvision_ajax_obj !== 'undefined' && window.accuvision_ajax_obj.ajax_url;

      if (isWpAjax) {
        // Send via WordPress admin-ajax.php
        const formData = new FormData(quizForm);
        formData.append('action', 'accuvision_quiz_submission');
        formData.append('nonce', window.accuvision_ajax_obj.nonce || '');
        formData.append('outcome_status', finalResult.status);
        formData.append('outcome_id', finalResult.id);

        fetch(window.accuvision_ajax_obj.ajax_url, {
          method: 'POST',
          body: formData
        })
          .then(res => res.json())
          .catch(err => {
            console.warn('WP AJAX request failed, proceeding to display result:', err);
          })
          .finally(() => {
            displayFinalResult(finalResult, answers);
          });
      } else {
        // Standalone or custom submission simulation (500ms delay for natural UX)
        setTimeout(() => {
          displayFinalResult(finalResult, answers);
        }, 500);
      }
    }

    function setHiddenField(name, value) {
      let field = quizForm.querySelector(`input[name="${name}"]`);
      if (!field) {
        field = document.createElement('input');
        field.type = 'hidden';
        field.name = name;
        quizForm.appendChild(field);
      }
      field.value = value;
    }

    function displayFinalResult(result, answers) {
      currentStep = 7; // Result step
      updateStepView();

      if (resultContainer) {
        let boxClass = 'qualified';
        let statusIcon = '✓';
        if (result.status === 'flagged') {
          boxClass = 'flagged';
          statusIcon = 'ℹ';
        } else if (result.status === 'disqualified') {
          boxClass = 'disqualified';
          statusIcon = '⚠';
        }

        resultContainer.innerHTML = `
          <div class="accu-result-box ${boxClass}">
            <div class="accu-result-status-tag">
              <span>${statusIcon}</span> ${result.tag}
            </div>
            <h3 class="accu-result-heading">${result.title}</h3>
            <p class="accu-result-message">${result.message}</p>
            <div class="accu-result-cta-box">
              <a href="tel:8005550199" class="accu-cta-btn accu-cta-primary">
                📞 Speak with Our Team
              </a>
              <a href="mailto:info@accuvision.com?subject=LASIK Candidacy Follow-Up for ${encodeURIComponent(answers.firstName + ' ' + answers.lastName)}" class="accu-cta-btn accu-cta-outline">
                ✉ Email Consultation
              </a>
            </div>
          </div>
          <div style="font-size: 0.85rem; color: #64748b; line-height: 1.5; text-align: center;">
            A confirmation record of your quiz answers has been noted for <strong>${escapeHtml(answers.firstName)} ${escapeHtml(answers.lastName)}</strong> (${escapeHtml(answers.email)}).
          </div>
        `;
      }
    }

    function resetQuiz() {
      quizForm.reset();
      quizForm.querySelectorAll('.accu-option-label.selected').forEach(lbl => lbl.classList.remove('selected'));
      quizForm.querySelectorAll('.accu-input.error').forEach(inp => inp.classList.remove('error'));
      quizForm.querySelectorAll('.accu-error-msg.show').forEach(msg => msg.classList.remove('show'));

      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = 'Submit & See Results ➔';
      }

      currentStep = 1;
      updateStepView();
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // Launch
    initQuiz();
  });
})();
