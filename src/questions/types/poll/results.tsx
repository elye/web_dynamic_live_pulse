import {
  pollFamilyResults,
  multipleChoiceTotal,
} from "../../../features/results/pollFamily";

export const results = pollFamilyResults({
  chosenDisplay: true,
  total: multipleChoiceTotal,
});
