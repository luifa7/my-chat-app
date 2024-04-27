import { personalityDetails } from "../data/personalities";
import { commonInstructions } from "../data/general";
export function generateInstructions(
  personality,
  lastText: string,
  history: [],
  conversationalAtmosphere: string
): string {
  const instructions = {
    name: personalityDetails[personality].name,
    general_instructions: commonInstructions.replace(
      /\{\{name\}\}/g,
      personalityDetails[personality].name
    ),
    atmosphere:
      "[ATMOSPHERE]: " +
      conversationalAtmosphere,
    dedicated_instruccions:
      personalityDetails[personality].additionalInstructions,
    lastText: lastText,
    history: history,
  };

  return JSON.stringify(instructions);
}
