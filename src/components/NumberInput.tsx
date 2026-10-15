import { useEffect, useState, type InputHTMLAttributes } from "react";

/**
 * A number field that keeps what the user typed (empty, "-", "01") while only
 * reporting valid numbers, so a leading 0 can be replaced and the field can be cleared.
 */
export function NumberInput({
  value,
  onValue,
  ...props
}: {
  value: number;
  onValue: (value: number) => void;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
>) {
  const [text, setText] = useState(String(value));
  useEffect(() => {
    setText((current) => (Number(current) === value ? current : String(value)));
  }, [value]);
  return (
    <input
      {...props}
      type="number"
      value={text}
      onChange={(event) => {
        setText(event.target.value);
        const parsed = Number(event.target.value);
        if (event.target.value !== "" && Number.isFinite(parsed))
          onValue(parsed);
      }}
    />
  );
}
