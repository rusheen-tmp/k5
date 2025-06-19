const messagesEl = document.getElementById('messages');
const input      = document.getElementById('userInput');

let isTyping = false;
let stateData = null;
let currentState = null;
const correctKey = "PHC-CYBER-2025";

function setInputEnabled(enabled) {
  input.disabled = !enabled;
  if (enabled) input.focus();
}

/* Typewriter */
function typeWriter(text, className = '') {
  return new Promise(resolve => {
    const span = document.createElement('span');
    if (className) span.className = className;
    messagesEl.appendChild(span);

    let i = 0;
    isTyping = true;
    setInputEnabled(false);

    const typeInterval = setInterval(() => {
      span.textContent = text.slice(0, ++i);
      if (i === text.length) {
        clearInterval(typeInterval);
        messagesEl.appendChild(document.createElement('br'));
        messagesEl.scrollTop = messagesEl.scrollHeight;
        isTyping = false;
        setInputEnabled(true);
        resolve();
      }
    }, 30);
  });
}
async function clerkSay(text) {
  await typeWriter('Clerk: ', 'nameClerk');
  await typeWriter(text);
}
async function youSay(text) {
  await typeWriter('You: ', 'nameYou');
  await typeWriter(text);
}

async function loadStateMap() {
  const res = await fetch('stateMap.json');
  stateData = await res.json();
  currentState = stateData.start_state;
  await clerkSay(stateData.states[currentState].prompt);
}
loadStateMap();

function randomChoice(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
}

input.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter' && input.value.trim() && !isTyping && stateData) {
    const userText = input.value.trim();
    await youSay(userText);
    input.value = '';

    // If correct key entered anywhere, jump to success state
    if (userText.toUpperCase() === correctKey) {
      await clerkSay("Access granted. Welcome to the Castle’s Antechamber.");
      await clerkSay("Please wait while your identity is confirmed. Estimated wait time: ∞ minutes.");
      return;
    }

    // Look for trigger keywords
    const triggers = stateData.global_triggers;
    let triggeredResponse = null;
    for (const trigName in triggers) {
      const trig = triggers[trigName];
      if (trig.keywords.some(k => userText.toLowerCase().includes(k))) {
        triggeredResponse = randomChoice(trig.responses);
        break;
      }
    }

    if (triggeredResponse) {
      await clerkSay(triggeredResponse);
      return;
    }

    // Follow state transitions otherwise
    const stateObj = stateData.states[currentState];
    const nextStates = stateObj.transitions;
    if (nextStates && nextStates.length > 0) {
      currentState = randomChoice(nextStates);
      const responseLine = stateData.states[currentState].response || stateData.states[currentState].prompt;
      await clerkSay(responseLine);
    } else {
      // Dead end; loop a taunt
      await clerkSay("The silence thickens. Produce the correct record, or linger forever.");
    }
  }
});
