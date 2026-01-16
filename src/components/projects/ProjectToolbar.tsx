"use client";

import { useRef } from "react";

import { Button } from "@/components/ui/button";

export function ProjectToolbar({
  projectTitle,
  onAddChild,
  onExport,
  onImport,
}: {
  projectTitle: string;
  onAddChild: () => void;
  onExport: () => void;
  onImport: (json: unknown) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex h-14 items-center justify-between gap-3 border-b bg-background px-4">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{projectTitle}</div>
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            void file.text().then((text) => {
              onImport(JSON.parse(text) as unknown);
            });

            e.target.value = "";
          }}
        />

        <Button variant="outline" size="sm" onClick={onExport}>
          Export
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          Import
        </Button>
        <Button size="sm" onClick={onAddChild}>
          Add Child
        </Button>
      </div>
    </div>
  );
}
