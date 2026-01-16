"use client";

import { createContext, useContext } from "react";

type AddChildSide = "top" | "bottom";

export type FlowActions = {
  addChild: (parentNodeId: string, opts: { side: AddChildSide; x: number; y: number }) => void;
};

const FlowActionsContext = createContext<FlowActions | null>(null);

export function FlowActionsProvider({
  value,
  children,
}: {
  value: FlowActions;
  children: React.ReactNode;
}) {
  return <FlowActionsContext.Provider value={value}>{children}</FlowActionsContext.Provider>;
}

export function useFlowActions() {
  const ctx = useContext(FlowActionsContext);
  if (!ctx) throw new Error("useFlowActions must be used within <FlowActionsProvider>");
  return ctx;
}
