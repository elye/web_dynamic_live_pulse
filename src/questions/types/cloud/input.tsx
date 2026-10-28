import { TextInput } from "../../../features/participant/question/inputs/TextInput";
import { type QuestionInput } from "../../ui/input";

export const input: QuestionInput = {
  listsAnswers: true,
  clearsAfterSubmit: true,
  remember: (previous, value) => [
    ...(Array.isArray(previous)
      ? (previous as string[])
      : previous
        ? [String(previous)]
        : []),
    String(value).trim(),
  ],
  Input: () => (
    <TextInput
      label="Your word or short phrase"
      placeholder="First thing that comes to mind..."
      rows={2}
      maxLength={30}
    />
  ),
};
