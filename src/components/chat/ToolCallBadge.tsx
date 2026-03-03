"use client";

import { Loader2 } from "lucide-react";

export function getToolCallLabel(toolName: string, args: Record<string, any>): string {
  if (toolName === "str_replace_editor") {
    const { command, path } = args;
    switch (command) {
      case "create":     return `Creating ${path}`;
      case "str_replace": return `Editing ${path}`;
      case "insert":     return `Editing ${path}`;
      case "view":       return `Reading ${path}`;
      case "undo_edit":  return `Undoing edit in ${path}`;
    }
  }

  if (toolName === "file_manager") {
    const { command, path } = args;
    switch (command) {
      case "rename": return `Renaming ${path}`;
      case "delete": return `Deleting ${path}`;
    }
  }

  return toolName;
}

interface ToolCallBadgeProps {
  toolInvocation: {
    toolName: string;
    args: Record<string, any>;
    state: string;
    result?: unknown;
  };
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const { toolName, args, state, result } = toolInvocation;
  const label = getToolCallLabel(toolName, args);
  const isComplete = state === "result" && result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
