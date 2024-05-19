<template>
  <div class="chat-window">
    <h2>PERSONALITY</h2>
    <div>
      <label>
        <input type="radio" value="normalo" v-model="responseMode" /> Normalo
      </label>
      <label>
        <input type="radio" value="profesor" v-model="responseMode" />
        Profesor
      </label>
      <label>
        <input type="radio" value="drago" v-model="responseMode" />
        Drago
      </label>
      <label>
        <input type="radio" value="kreativa" v-model="responseMode" />
        Kreativa
      </label>
      <label>
        <input type="radio" value="frank" v-model="responseMode" />
        Frank
      </label>
      <label>
        <input type="radio" value="bateman" v-model="responseMode" />
        Bateman
      </label>
      <label>
        <input type="radio" value="salander" v-model="responseMode" />
        Salander
      </label>
      <label>
        <input type="radio" value="random" v-model="responseMode" />
        Random
      </label>
    </div>
    <h2>ATMOSPHERE OF THE CONVERSATION</h2>
    <div>
      <label>
        <input type="radio" value="normal" v-model="conversationalAtmosphere" />
        Normal
      </label>
      <label>
        <input
          type="radio"
          value="consensus"
          v-model="conversationalAtmosphere"
        />
        Consensus
      </label>
      <label>
        <input
          type="radio"
          value="disagreement"
          v-model="conversationalAtmosphere"
        />
        Disagreement
      </label>
      <label>
        <input type="radio" value="love" v-model="conversationalAtmosphere" />
        Love
      </label>
      <label>
        <input type="radio" value="hate" v-model="conversationalAtmosphere" />
        Hate
      </label>
      <label>
        <input type="radio" value="ironic" v-model="conversationalAtmosphere" />
        Ironic
      </label>
      <label>
        <input
          type="radio"
          value="serious"
          v-model="conversationalAtmosphere"
        />
        Serious
      </label>
      <label>
        <input type="radio" value="formal" v-model="conversationalAtmosphere" />
        Formal
      </label>
      <label>
        <input
          type="radio"
          value="disrespectful"
          v-model="conversationalAtmosphere"
        />
        Disrespectful
      </label>
    </div>
    <ul class="chat-messages" ref="messagesContainer">
      <li
        v-for="(entry, index) in conversationHistory"
        :key="index"
        class="chat-message"
        :class="[
          entry.source === 'user' ? 'user' : 'response',
          getMessageAlignment(index),
        ]"
        :style="{
          color: getTextColor(entry.source),
          backgroundColor: 'darkgray',
        }"
      >
        {{ entry.text }}
      </li>
    </ul>
    <div>
      <input
        class="input-message"
        v-model="userInput"
        @keyup.enter="sendPrompt"
        placeholder="Type a message..."
        :disabled="isLoading"
      />
    </div>
    <div>
      <button
        @click="sendPrompt"
        :disabled="isLoading || autoMode"
        style="margin-right: 5px"
      >
        Send
      </button>
      <button @click="clearConversation" :disabled="isLoading || autoMode">
        Clear
      </button>
    </div>
    <button
      @click="startAutomaticMode"
      :disabled="isLoading || autoMode"
      style="margin-right: 5px"
    >
      Start Automatic Mode
    </button>
    <button @click="stopAutomaticMode" :disabled="!autoMode">
      Stop Automatic Mode
    </button>
    <div v-if="isLoading" class="spinner"></div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from "vue";
import axios from "axios";
import { personalityDetails } from "../data/personalities";
import { generateInstructions } from "../data/functions";

const conversationHistory = ref([]);
const userInput = ref("");
const responseMode = ref("normalo");
const conversationalAtmosphere = ref("normal");
const isLoading = ref(false);
const autoMode = ref(false);
const previousSpeaker = ref(null);

const messagesContainer = ref(null);

watch(conversationHistory, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
});

const sendPrompt = async () => {
  isLoading.value = true;
  const selectedPersonality = autoMode.value
    ? selectRandomPersonality()
    : responseMode.value;

  const lastText =
    conversationHistory.value.length > 0 && autoMode.value
      ? conversationHistory.value.slice(-1)[0].text
      : conversationHistory.value.length === 0 && autoMode.value
      ? "[Activated Rule: discuss with each other following this context]: " +
        userInput.value
      : userInput.value;

  if (userInput.value) {
    conversationHistory.value.push({
      text: lastText.replace(/["']/g, ""),
      source: "user",
      done: true, // Mark user input as complete
    });
    userInput.value = ""; // Clear the user input field after adding to history
  }

  // if (!autoMode.value && lastText.includes(userInput.value)) {
  //   conversationHistory.value.push({ text: lastText, source: "user" });
  // }

  // if (!autoMode.value && lastText === userInput.value) {
  //   conversationHistory.value.push({ text: lastText, source: "user" });
  // } else if (autoMode.value && conversationHistory.value.length == 0) {
  //   conversationHistory.value.push({ text: lastText, source: "user" });
  // }

  // console.log(conversationHistory.value);
  const fullPrompt = generateInstructions(
    selectedPersonality,
    lastText,
    conversationHistory.value,
    conversationalAtmosphere.value
  );

  try {
    console.log(fullPrompt);
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3",
        prompt: fullPrompt,
        stream: true,
      }),
    });

    const reader = response.body.getReader();
    let partialData = "";
    let currentStreamText = ""; // Used to hold ongoing streamed text

    const processChunk = (value) => {
      partialData += new TextDecoder("utf-8").decode(value, { stream: true });
      try {
        let lastNewlineIndex = partialData.lastIndexOf("\n");
        if (lastNewlineIndex !== -1) {
          let completeMessages = partialData.slice(0, lastNewlineIndex);
          partialData = partialData.slice(lastNewlineIndex + 1);

          completeMessages.split("\n").forEach((message) => {
            if (message.trim()) {
              const data = JSON.parse(message);
              if (data.response !== undefined) {
                currentStreamText += data.response;
                // Update the last entry or create a new one if none exists
                if (
                  conversationHistory.value.length > 0 &&
                  !conversationHistory.value.at(-1).done
                ) {
                  conversationHistory.value.at(-1).text = currentStreamText;
                } else {
                  conversationHistory.value.push({
                    text: currentStreamText.replace(/["']/g, ""),
                    source: selectedPersonality,
                    done: false,
                  });
                }
                if (data.done) {
                  conversationHistory.value.at(-1).done = true;
                  currentStreamText = ""; // Reset for next message
                  if (conversationHistory.length > 10) {
                    // If it exceeds, remove the oldest message
                    conversationHistory.shift();
                  }
                }
              }
            }
          });
        }
      } catch (err) {
        console.error("Error parsing JSON:", err);
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        isLoading.value = false;
        break;
      }
      processChunk(value);
    }

    // Handle any remaining partial data
    if (partialData) {
      processChunk(new TextEncoder().encode(partialData));
      partialData = "";
    }
  } catch (error) {
    console.error("Error during streaming:", error);
  } finally {
    isLoading.value = false;
    if (autoMode.value) {
      await nextTick();
      setTimeout(sendPrompt, 1000);
    }
  }
};

function getMessageAlignment(index) {
  return index % 2 === 0 ? "left-align" : "right-align";
}

function getTextColor(source) {
  return source === "user" ? "white" : "purple";
}

function processResponse(response, personality) {
  if (response.data && response.data.response) {
    conversationHistory.value.push({
      text: `${response.data.response}`,
      source: personality.name,
    });
  }
}

// function selectRandomPersonality() {
//   let options = Object.keys(personalityDetails).filter(
//     (p) => p !== previousSpeaker.value
//   );
//   previousSpeaker.value = options[Math.floor(Math.random() * options.length)];
//   return previousSpeaker.value;
// }

function selectRandomPersonality() {
  // Analyze conversation history to determine which personalities have contributed recently
  let recentContributors = new Set();
  conversationHistory.value.forEach((entry) => {
    if (entry.source && entry.source !== previousSpeaker.value) {
      recentContributors.add(entry.source);
    }
  });

  // Filter personalities based on recent contributions and select from remaining options
  let options = Object.keys(personalityDetails).filter(
    (p) => p !== previousSpeaker.value && !recentContributors.has(p)
  );

  // If no options remain, fall back to random selection
  if (options.length === 0) {
    options = Object.keys(personalityDetails).filter(
      (p) => p !== previousSpeaker.value
    );
  }

  // Randomly select the next personality
  const nextPersonality = options[Math.floor(Math.random() * options.length)];
  previousSpeaker.value = nextPersonality;

  return nextPersonality;
}

const startAutomaticMode = () => {
  if (!userInput.value && conversationHistory.value.length === 0) {
    alert("Please enter a message to start the automatic mode.");
    return;
  }
  autoMode.value = true;
  sendPrompt();
};

const stopAutomaticMode = () => {
  autoMode.value = false;
  isLoading.value = false;
};

const clearConversation = () => {
  conversationHistory.value = [];
  userInput.value = "";
  autoMode.value = false;
  isLoading.value = false;
};
</script>

<style scoped>
.chat-window {
  max-width: 900px;
  margin: auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 4px solid #3498db;
  width: 40px;
  height: 40px;
  -webkit-animation: spin 2s linear infinite; /* Safari */
  animation: spin 2s linear infinite;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
ul {
  margin-bottom: 10px;
}
.chat-messages {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.chat-message {
  padding: 10px 20px;
  margin-bottom: 8px;
  border-radius: 20px;
  max-width: 80%;
  word-wrap: break-word;
}

/* .user {
  background-color: red;
  color: white;
}

.response {
  background-color: blue;
  color: white;
} */

.left-align {
  margin-right: auto; /* Align to left */
  text-align: left;
}

.right-align {
  margin-left: auto; /* Align to right */
  text-align: right;
}

.user,
.response {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); /* Subtle shadow */
}
button {
  margin-top: 10px;
}

.input-message {
  width: 100%; /* Full width of its container */
  padding: 12px 20px; /* Top and bottom padding, left and right padding */
  margin: 8px 0; /* Margin top and bottom */
  display: inline-block; /* Takes up the full line */
  border: 1px solid #ccc; /* Light grey border */
  border-radius: 4px; /* Rounded borders */
  box-sizing: border-box; /* Box sizing border-box */
  font-size: 16px; /* Larger font size */
  font-family: Arial, sans-serif; /* Font family */
}

.input-message:focus {
  border-color: #4a90e2; /* Blue border on focus */
  outline: none; /* Removes the default focus outline */
}

/* Style for the placeholder */
::placeholder {
  /* Chrome, Firefox, Opera, Safari 10.1+ */
  color: #888; /* Gray text */
  opacity: 1; /* Fully opaque (not transparent) */
}
</style>
