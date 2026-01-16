import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-2xl text-sm font-semibold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          variant === "default" && "bg-white text-black hover:bg-gray-200 px-6 py-3",
          variant === "outline" && "border border-white/20 bg-transparent hover:bg-white/5 text-white px-6 py-3",
          variant === "ghost" && "hover:bg-white/5 text-white px-4 py-2",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };