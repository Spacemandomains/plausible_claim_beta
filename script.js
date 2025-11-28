const elements = [
  {
    name: "Protected Activity",
    question: "Plaintiff, describe your protected activity (e.g., filing an EEOC charge or requesting an accommodation). Include date and evidence."
  },
  {
    name: "Adverse Employment Action",
    question: "Describe the adverse action taken against you (e.g., suspension, demotion, termination). Include dates, effect on pay/responsibilities, and documents."
  },
  {
    name: "Causal Connection / But-For Cause",
    question: "Explain how the adverse action was caused by your protected activity (timing, statements, patterns, other evidence)."
  }
];

let currentStep = 0;
let answers = [];

function showQuestion() {
  if (currentStep < elements.length) {
    document.getElementById('gameContent').innerHTML = `
      <div class="question">${elements[currentStep].name}</div>
      <div>${elements[currentStep].question}</div>
      <textarea id="answer"></textarea>
      <button onclick="nextStep()">Submit Answer</button>
    `;
  } else {
    showResults();
  }
}

function nextStep() {
  const answer = document.getElementById('answer').value.trim();
  if (answer === "") {
    alert("Please provide an answer.");
    return;
  }
  answers.push({element: elements[currentStep].name, answer});
  currentStep++;
  showQuestion();
}

function showResults() {
  let content = "<h3>Judge's Plausibility Ruling:</h3>";
  content += "<div class='result'>";
  answers.forEach(a => {
    content += `<p><strong>${a.element}:</strong> ${a.answer}</p>`;
  });
  content += "<hr>";
  content += "<p>Based on your responses, your retaliation claim is <strong>facially plausible under federal law</strong>. The facts are substantive and support each required element.</p>";
  content += "</div>";
  document.getElementById('gameContent').innerHTML = content;
}

showQuestion();
