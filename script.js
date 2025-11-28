// =================================================================
// FEDERAL RETALIATION CLAIM GAME: COMPLETE JAVASCRIPT LOGIC (NO SCORE DISPLAY)
// =================================================================

// --- GAME STATE AND ELEMENTS ---
const elements = [
    {
        name: "Protected Activity",
        question: "Plaintiff, describe your protected activity (e.g., filing an an internal complaint, an EEOC charge, or requesting a reasonable accommodation). Include date and evidence."
    },
    {
        name: "Adverse Employment Action",
        question: "Describe the adverse action taken against you (e.g., suspension, demotion, termination, or significant change in duties). Include dates, effect on pay/responsibilities, and documents."
    },
    {
        name: "Causal Connection / But-For Cause",
        question: "Explain how the adverse action was caused by your protected activity (timing, statements, patterns, or other evidence)."
    }
];

let currentStep = 0;
let answers = [];

// --- SCORING CONSTANTS ---
const SCORE_THRESHOLDS = {
    WEAK: 3,        // Below 3: Weak Claim
    PLAUSIBLE: 6    // 3 to 5: Plausible Claim | 6+: Legally Strong Claim
};

const SCORE_WEIGHTS = {
    DATE_COUNT: 1,
    SPECIFIC_PERSON: 1,
    ACTION_SPECIFIC: 1,
    TIMING_BONUS: 2,    // Bonus for very close proximity (Causal Connection only)
    POLICY_BONUS: 1     // Bonus for mentioning policy deviation (Causal Connection only)
};

// =================================================================
// CORE GAME LOGIC FUNCTIONS
// =================================================================

/**
 * Renders the current question or the results screen.
 */
function showQuestion() {
    const gameContent = document.getElementById('gameContent');
    if (!gameContent) {
        console.error("Element with ID 'gameContent' not found.");
        return;
    }

    if (currentStep < elements.length) {
        gameContent.innerHTML = `
            <div class="question"><h2>${elements[currentStep].name}</h2></div>
            <p>${elements[currentStep].question}</p>
            <textarea id="answer" rows="5" placeholder="Provide specific facts: Who, What, When, Where..."></textarea>
            <button onclick="nextStep()">Submit Answer</button>
        `;
    } else {
        showResults();
    }
}

/**
 * Captures the answer, stores it, and moves to the next step.
 */
function nextStep() {
    const answerElement = document.getElementById('answer');
    if (!answerElement) {
        alert("Error: Input field not found.");
        return;
    }
    const answer = answerElement.value.trim();

    if (answer === "") {
        alert("Please provide specific facts for this element of the claim.");
        return;
    }
    
    // Store the answer along with its element name
    answers.push({ element: elements[currentStep].name, answer: answer });
    currentStep++;
    showQuestion();
}

/**
 * Calculates the score for a single answer based on factual indicators.
 * @param {string} text - The input text (Plaintiff's answer).
 * @param {string} element - The current element name (for bonus scoring).
 * @returns {number} The calculated score.
 */
function extractFactualIndicators(text, element) {
    let score = 0;

    // 1. Check for specific dates
    const dateRegex = /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{1,2}(?:st|nd|rd|th)?,\s\d{4}|\b\d{4})/i;
    if (dateRegex.test(text)) {
        score += SCORE_WEIGHTS.DATE_COUNT;
    }

    // 2. Check for proper nouns/names
    const nameRegex = /([A-Z][a-z]+)\s([A-Z][a-z]+)/g;
    if (text.match(nameRegex) && text.match(nameRegex).length > 0) {
        score += SCORE_WEIGHTS.SPECIFIC_PERSON;
    }

    // 3. Check for specific, non-conclusory actions/terms (Applies to Protected Activity and AEA)
    if (element === "Protected Activity" || element === "Adverse Employment Action") {
        const actionRegex = /(EEOC|accommodation|demotion|termination|pay cut|transfer|suspension|fired|complaint|testified|disciplined)/i;
        if (actionRegex.test(text)) {
            score += SCORE_WEIGHTS.ACTION_SPECIFIC;
        }
    }

    // 4. Special Scoring for Causal Connection (But-For Cause)
    if (element === "Causal Connection / But-For Cause") {
        // A. Look for strong temporal proximity indicators (e.g., 'days,' 'week,' 'immediately')
        const proximityRegex = /(\d{1,2}\s(?:days|weeks|week)|immediately|just\s[a-z]*\safter)/i;
        if (proximityRegex.test(text)) {
            score += SCORE_WEIGHTS.TIMING_BONUS; 
        }
        
        // B. Look for policy or pattern evidence (suggesting pretext/deviation)
        const policyRegex = /(handbook|policy|procedure|standard practice|no warning|deviation|sudden change|clean record)/i;
        if (policyRegex.test(text)) {
            score += SCORE_WEIGHTS.POLICY_BONUS;
        }
    }

    // 5. Conclusion Penalty: If the score is low AND legal jargon is present, it's likely a conclusion.
    const conclusionTerms = /(retaliated|discriminatory|illegal|unfair|unjust|harassment|hostile|bad faith)/i;
    const baseScore = score - (element === "Causal Connection / But-For Cause" ? SCORE_WEIGHTS.TIMING_BONUS + SCORE_WEIGHTS.POLICY_BONUS : 0);
    
    if (conclusionTerms.test(text) && baseScore < 1) {
        return 0; 
    }

    return score;
}

/**
 * Calculates the total score and displays the final legal ruling (without showing P_Total).
 */
function showResults() {
    let totalPlausibilityScore = 0;
    
    // 1. Analyze and score each answer
    answers.forEach(item => {
        item.score = extractFactualIndicators(item.answer, item.element);
        totalPlausibilityScore += item.score;
    });

    // 2. Determine the legal ruling
    let rulingText;
    let rulingDescription;
    let rulingClass;

    if (totalPlausibilityScore < SCORE_THRESHOLDS.WEAK) {
        // P_Total < 3
        rulingClass = 'weak-claim';
        rulingText = 'Weak Claim: Dismissed for Failure to State a Claim.';
        rulingDescription = `The allegations predominantly use **legal conclusions** rather than specific facts (Who, What, When). The claim fails to meet the **Plausibility Standard** and would likely be dismissed on a Motion to Dismiss (Rule 12(b)(6)).`;
    } else if (totalPlausibilityScore < SCORE_THRESHOLDS.PLAUSIBLE) {
        // 3 <= P_Total < 6
        rulingClass = 'plausible-claim';
        rulingText = 'Facially Plausible: Proceed to Discovery.';
        rulingDescription = `The facts are substantive and support the *prima facie* elements, meeting the **Plausibility Standard** (*Twombly/Iqbal*). The Motion to Dismiss would be DENIED, allowing the case to move to the rigorous factual investigation phase (Discovery).`;
    } else {
        // P_Total >= 6
        rulingClass = 'strong-claim';
        rulingText = 'Legally Strong: Well-Pled Complaint.';
        rulingDescription = `The claim is supported by **highly specific allegations**, including strong **temporal proximity** and/or evidence of **pretext** (policy deviation). This positions the Plaintiff favorably to withstand a later Motion for Summary Judgment.`;
    }
    
    // 3. Render the Results (Excluding the P_Total score display)
    let content = "<h3>🏛️ Judge's Plausibility Ruling:</h3>";
    content += `<div class='${rulingClass} result-box'>`;
    
    // Display the submitted facts
    answers.forEach(a => {
        // NOTE: score is NOT included in the final output
        content += `<p><strong>${a.element}:</strong> <em>${a.answer}</em></p>`;
    });

    content += `<hr>`;
    content += `<h2 class="ruling-title">${rulingText}</h2>`;
    content += `<p class="ruling-description">${rulingDescription}</p>`;
    content += "</div>";
    
    document.getElementById('gameContent').innerHTML = content;
}

// --- INITIALIZE GAME ---
showQuestion();

// NOTE: You will need corresponding CSS classes (.weak-claim, .plausible-claim, .strong-claim) 
// to visually distinguish the different rulings in your HTML setup.
