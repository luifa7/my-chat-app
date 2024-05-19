import { personalityDetails } from "../data/personalities";
import { commonInstructions } from "../data/general";
export function generateInstructions(
  personality,
  lastText: string,
  history: [],
  conversationalAtmosphere: string
): string {
  //   console.log(lastText);
  var historyToSend = history && history.length > 0 ? history.slice(0, -1) : [];
  const instructions = {
    name: personalityDetails[personality].name,
    rules: commonInstructions.replace(
      /\{\{name\}\}/g,
      personalityDetails[personality].name
    ),
    atmosphere: conversationalAtmosphere,
    instruccions: personalityDetails[personality].additionalInstructions,
    lastText: lastText.replace(/["']/g, ""),
    history: historyToSend,
  };
  var preText = `
  THIS IS NOT A DATASET OF A CONVERSATION TO ANALYSE.
  THIS IS A PROMPT THAT PROVIDES YOU THE INFORMATION TO ANSWER FOLLOWING THE INSTRUCTIONS.
  Messages of this kind 'What an intriguing conversation!' are not allowed and if they appear should be ignored.
  The json is the prompt, utilize the information provided to craft your response. 
  lastText: is the last message that was sent in the conversation. This one has higher priority than the history. 
  history: is the conversation history. It is an array sorted from the oldest message to the newest. To understand the following conversation, you should read the history. The first possition is the oldest message and the last is the newest. Take really in count the last messages before you respond.
  atmosphere: is the atmosphere of the conversation. Always respect it.
  instruccions: are the instructions for the personality.
  rules: are the general rules for the conversation.
  name: is your name.
  Do not introduce yourself unless someone asks you.
  Remember to stay true to your assigned personality traits and adhere to the common instructions provided. 
  Keep responses concise, using no more than 15 words per message. 
  Be proactive, creative, and spontaneous in initiating dialogue, considering your character's personality and the conversation's context.
  Avoid unnecessary analysis or summaries unless directly requested.
  Stay on topic and avoid shifting the conversation abruptly.
  When summarizing the conversation, focus on highlighting key points and insights relevant to the ongoing discussion.
  Avoid repetitive or formulaic openings. De creative and spontaneous in how you initiate dialogue, considering your character personality and the context of the conversation.
  After 3 messages in the history discussing a topic, you have to change the topic. 
  If the topic was changed, then follow the conversation and do not go back to the previous topic.
  `;
  return preText + JSON.stringify(instructions);
}
