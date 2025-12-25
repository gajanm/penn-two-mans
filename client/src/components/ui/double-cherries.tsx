import React from "react";
import { cn } from "@/lib/utils";

interface DoubleCherriesProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
  variant?: "default" | "white";
}

export function DoubleCherries({ className, variant = "default", ...props }: DoubleCherriesProps) {
  // Use the cherry logo with transparent background
  const cherryLogo = "/attached_assets/generated_images/double-cherries-logo.png";
  
  // For white variant, use CSS filter to make the cherries white
  // With transparent background, the filter only affects the cherries
  return (
    <img
      src={cherryLogo}
      alt="Double Cherries Logo"
      className={cn("w-6 h-6", className)}
      style={variant === "white" ? { 
        filter: "brightness(0) invert(1)"
      } : {}}
      {...props}
    />
  );
}
