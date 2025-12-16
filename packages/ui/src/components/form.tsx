import * as React from "react";
import "./form.css"

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {}

export const Form: React.FC<FormProps> = ({ className = "", ...props }) => {
  return (
    <form
      className={["form", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
};

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label: React.FC<LabelProps> = ({
  className = "",
  ...props
}) => {
  return (
    <label
      className={["label", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input: React.FC<InputProps> = ({
  className = "",
  error = false,
  ...props
}) => {
  return (
    <input
      className={[
        "input",
        error && "input-error",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
};