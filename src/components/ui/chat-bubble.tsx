import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * Native chat bubble primitives — start/end aligned rows with an avatar
 * column and a bubble body, styled to the institutional palette.
 * No dependencies. Use ChatBubble.Row + .Avatar + .Body together.
 */

type Align = "start" | "end";

interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: Align;
}

function Row({ align = "start", className, children, ...props }: RowProps) {
  return (
    <div
      className={cn(
        "flex items-end gap-2.5",
        align === "end" && "flex-row-reverse",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface BubbleAvatarProps {
  initials: string;
  /** Render an invisible spacer to keep alignment when the avatar is hidden (consecutive messages) */
  placeholder?: boolean;
  className?: string;
}

function BubbleAvatar({ initials, placeholder, className }: BubbleAvatarProps) {
  if (placeholder) {
    return <div aria-hidden="true" className="w-8 shrink-0" />;
  }
  return (
    <Avatar className={cn("w-8 h-8 shrink-0", className)}>
      <AvatarFallback className="bg-muted text-muted-foreground text-[11px] font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

interface BodyProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: Align;
}

function Body({ align = "start", className, children, ...props }: BodyProps) {
  return (
    <div
      className={cn(
        "max-w-[75%] sm:max-w-[70%] flex flex-col",
        align === "end" && "items-end",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Optional sender label above the bubble */
function Header({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("text-[11px] text-muted-foreground mb-1 px-1", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface BubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: Align;
}

function Bubble({ align = "start", className, children, ...props }: BubbleProps) {
  return (
    <div
      className={cn(
        "rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words",
        align === "end"
          ? "bg-foreground text-background rounded-br-md"
          : "bg-muted text-foreground rounded-bl-md border border-border/50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Timestamp / status line under the bubble */
function Footer({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("text-[11px] text-muted-foreground mt-1 px-1", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export const ChatBubble = { Row, Avatar: BubbleAvatar, Body, Header, Bubble, Footer };
