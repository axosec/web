import * as React from "react";
import "./button.css"

type ButtonVariant = "primary" | "secondary" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  outline?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  outline = false,
  className = "",
  ...props
}) => {
  return (
    <button
      className={[
        "btn",
        `btn-${variant}`,
        `btn-${size}`,
        outline && "btn-outline",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
};
