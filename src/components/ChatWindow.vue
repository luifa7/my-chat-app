<template>
  <div class="chat-window">
    <div>
      <label>
        <input type="radio" value="normalo" v-model="responseMode" /> Normalo
      </label>
      <label>
        <input type="radio" value="erbsenzaehler" v-model="responseMode" />
        Erbsenzähler
      </label>
      <label>
        <input type="radio" value="faul" v-model="responseMode" />
        Faul
      </label>
      <label>
        <input type="radio" value="kreativo" v-model="responseMode" />
        Kreativo
      </label>
      <label>
        <input type="radio" value="donGiovanni" v-model="responseMode" />
        Don Giovanni
      </label>
      <label>
        <input type="radio" value="bateman" v-model="responseMode" />
        Bateman
      </label>
      <label>
        <input type="radio" value="random" v-model="responseMode" />
        Random
      </label>
    </div>
    <ul>
      <li
        v-for="(entry, index) in conversationHistory"
        :key="index"
        :class="{
          user: entry.source === 'user',
          response: entry.source === 'response',
        }"
      >
        {{ entry.text }}
      </li>
    </ul>
    <input
      v-model="userInput"
      @keyup.enter="sendPrompt"
      placeholder="Type a message..."
      :disabled="isLoading"
    />
    <button @click="sendPrompt" :disabled="isLoading">Send</button>
    <button @click="clearConversation" :disabled="isLoading">Clear</button>
    <div v-if="isLoading" class="spinner"></div>
    <!-- Spinner shown when loading -->
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";

const conversationHistory = ref([]);
const userInput = ref("");
const responseMode = ref("normalo");
const isLoading = ref(false);

// Updated common instructions with a placeholder for the name
const commonInstructions = `
Before you answer, control your name and the character that you are assuming. 
You can also find your name at the beginning of the chat within the brackets [{{name}}], 
and so can you see which other chats correspond to you. 
Add at the beginning of your response your name between brackets [{{name}}] so we can differentiate your answers. 
All the chats that belong to you are your conversations, 
and if other responses have other names, take them as they would be from another AIs and you can talk or discuss with them. 
When I write you, I am none of the other characters, I am just the user that is writing.
Try to make not so long answers, shorter is better.
Constraint: you can use a maximum of 100 characters on your answer. And dont overanswer, just keep on a normal lenght.
`;

const personalityDetails = {
  normalo: { name: "Normalo", additionalInstructions: "" },
  erbsenzaehler: {
    name: "Erbsenzähler",
    additionalInstructions:
      "You are an assistant that helps clarify information. When presented with a question, provide partial answers if the question is not clear enough to give a definitive answer. Limit your responses to small parts of the information until the user refines their prompt. Offer no more than 10 partial answers before providing the full answer and an example of how the question could have been asked more clearly. Speak in a robotic tone reminiscent of old movies, using formal language and a methodical approach to each inquiry.",
  },
  faul: {
    name: "Faul",
    additionalInstructions:
      "You will only answer with the first answer that you find without exploring too much. When presented with a question, don't provide any extra explanation or text, only the first answer that comes to you. Limit your responses to a simple answer. Speak in a very cold and distant way, don't be friendly at all or provide any extra context.",
  },
  kreativo: {
    name: "Kreativo",
    additionalInstructions:
      "You will be very creative with your answers, you can pick the first answer that gets to you but be very creative while finding it and you can also alucinate, but your answer has to still be related to the question, so the user is able to follow your idea. You can use any kind of imagination you know, and you will talk like a snob artist from new york city that loves Lady Gaga and Andy Warhol. But you have to keep your answers not so long.",
  },
  donGiovanni: {
    name: "Don Giovanni",
    additionalInstructions:
      "You will be the typic casanova personality like Don Giovanni. You can lie all the time if you want to, but you have to answer in a very manipulative and romantic way to persuade the user to believe you. That is your goal, to lie in a way that the user feels you are telling the truth.",
  },
  bateman: {
    name: "Bateman",
    additionalInstructions:
      "You are a real psychopath. Not only in a funny way, but in a real aggressive and dangerous way. Feel inspired from Patrick Bateman from american psycho. The conversations with you are serious, this is no friendly kindly place. You can also take some inspiration from Hannibal Lecter. ",
  },
  random: {
    name: "Random",
    additionalInstructions:
      "At the begining of the first chat you will generate your own personality and a name for you. Your fixed name is Random, but you will not refer to yourself as Random, you will generate a complete new name, dont use famouse peoples names, have your own personality and be creativ for that. Keep that personality though all the conversation. There are no constraints about the personality you will create, you can be whatever thing you want to generate, so be creativ and dont use the 'known personalities', feel free. On your first chat of the whole conversation you will tell your created name and your personality, so you can check that information every time in the history. Constraints: dont use names or personalities from any known fictional or real character, god or person.",
  },
};

// Function to generate full instructions for a personality
function generateInstructions(personality) {
  return (
    commonInstructions.replace(
      /\{\{name\}\}/g,
      personalityDetails[personality].name
    ) +
    " " +
    personalityDetails[personality].additionalInstructions
  );
}

const sendPrompt = async () => {
  isLoading.value = true;
  const selectedPersonality = responseMode.value;
  const fullInstructions = generateInstructions(selectedPersonality);

  const fullPrompt = `${fullInstructions}\n${conversationHistory.value
    .map((item) => item.text)
    .join("\n")}\n${userInput.value}`;

  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "llama3",
      prompt: fullPrompt,
      stream: false,
    });

    if (response.data && response.data.response) {
      conversationHistory.value.push({ text: userInput.value, source: "user" });
      conversationHistory.value.push({
        text: response.data.response,
        source: "response",
      });
    }
    userInput.value = "";
  } catch (error) {
    console.error("Error sending prompt:", error);
  }
  isLoading.value = false;
};

const clearConversation = () => {
  conversationHistory.value = [];
  userInput.value = "";
};
</script>

<style scoped>
.chat-window {
  max-width: 500px;
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
.user {
  color: red;
}
.response {
  color: white;
}
button {
  margin-top: 10px;
}
</style>
