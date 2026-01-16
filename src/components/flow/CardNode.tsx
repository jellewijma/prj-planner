"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";

import { cn } from "@/lib/utils";

import { useFlowActions } from "./FlowActionsContext";

type AddChildSide = "top" | "bottom";

type CardNodeData = {
  title: string;
  requirements: Array<{ done: number }>;
};

export const CardNode = memo(function CardNode({ id, data, selected, xPos, yPos }: NodeProps<CardNodeData>) {
  const { addChild } = useFlowActions();

  const total = data.requirements.length;
  const done = data.requirements.reduce((acc, r) => acc + (r.done ? 1 : 0), 0);

  function add(side: AddChildSide) {
    addChild(id, { side, x: xPos, y: yPos });
  }

  return (
    <div className={cn("group relative min-w-48", selected && "ring-2 ring-ring rounded-md")}>
      <button
        type="button"
        className={cn(
          "nodrag nopan absolute left-1/2 top-0 z-10 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-background text-sm leading-none opacity-0 shadow-sm transition-opacity group-hover:opacity-100",
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          add("top");
        }}
        aria-label="Add child above"
      >
        +
      </button>

      <div className="rounded-md border bg-card px-3 py-2 shadow-sm">
        <Handle type="target" position={Position.Top} />
        <div className="text-sm font-medium leading-5">{data.title}</div>
        {total > 0 ? (
          <div className="mt-1 text-xs text-muted-foreground">
            {done}/{total} requirements
          </div>
        ) : (
          <div className="mt-1 text-xs text-muted-foreground">No requirements</div>
        )}
        <Handle type="source" position={Position.Bottom} />
      </div>

      <button
        type="button"
        className={cn(
          "nodrag nopan absolute bottom-0 left-1/2 z-10 flex size-6 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border bg-background text-sm leading-none opacity-0 shadow-sm transition-opacity group-hover:opacity-100",
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          add("bottom");
        }}
        aria-label="Add child below"
      >
        +
      </button>
    </div>
  );
});
