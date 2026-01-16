"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

type NodeApi = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  x: number;
  y: number;
};

type RequirementApi = {
  id: string;
  node_id: string;
  text: string;
  done: number;
  sort_order: number;
};

export function NodeSheet({
  open,
  onOpenChange,
  node,
  requirements,
  onRefresh,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: NodeApi | null;
  requirements: RequirementApi[];
  onRefresh: () => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reqText, setReqText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTitle(node?.title ?? "");
    setDescription(node?.description ?? "");
  }, [node?.id, node?.title, node?.description]);

  const sortedRequirements = useMemo(
    () => [...requirements].sort((a, b) => a.sort_order - b.sort_order),
    [requirements],
  );

  async function save() {
    if (!node) return;

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/nodes/${node.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? "Save failed");
      }

      toast.success("Saved");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  async function addRequirement() {
    if (!node) return;
    if (!reqText.trim()) return;

    setBusy(true);
    try {
      const res = await fetch("/api/requirements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nodeId: node.id, text: reqText.trim() }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? "Failed to add requirement");
      }

      setReqText("");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleRequirement(req: RequirementApi) {
    setBusy(true);
    try {
      const res = await fetch(`/api/requirements/${req.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ done: !req.done }),
      });

      if (!res.ok) throw new Error("Update failed");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  async function updateRequirementText(req: RequirementApi, text: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/requirements/${req.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error("Update failed");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  async function deleteRequirement(req: RequirementApi) {
    setBusy(true);
    try {
      const res = await fetch(`/api/requirements/${req.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0">
        <SheetHeader>
          <SheetTitle>Card</SheetTitle>
          <SheetDescription>Edit card details and requirements.</SheetDescription>
        </SheetHeader>

        <Separator />

        <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
          <div className="grid gap-1">
            <div className="text-sm font-medium">Title</div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="grid gap-1">
            <div className="text-sm font-medium">Description</div>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">Requirements</div>

            {sortedRequirements.length === 0 ? (
              <div className="text-sm text-muted-foreground">No requirements yet.</div>
            ) : (
              <div className="grid gap-2">
                {sortedRequirements.map((r) => (
                  <div key={r.id} className="flex items-start gap-2 rounded-md border p-2">
                    <Checkbox
                      className="mt-0.5"
                      checked={!!r.done}
                      onCheckedChange={() => void toggleRequirement(r)}
                      disabled={busy}
                    />

                    <input
                      className="flex-1 bg-transparent text-sm outline-none"
                      defaultValue={r.text}
                      onBlur={(e) => {
                        const next = e.target.value.trim();
                        if (!next) return;
                        if (next !== r.text) void updateRequirementText(r, next);
                      }}
                      disabled={busy}
                    />

                    <Button variant="ghost" size="sm" onClick={() => void deleteRequirement(r)} disabled={busy}>
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={reqText}
                onChange={(e) => setReqText(e.target.value)}
                placeholder="Add requirement"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void addRequirement();
                  }
                }}
                disabled={busy}
              />
              <Button variant="outline" onClick={() => void addRequirement()} disabled={busy}>
                Add
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <SheetFooter className="flex-row items-center justify-between">
          <Button variant="destructive" onClick={onDelete} disabled={busy}>
            Delete card
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Close
            </Button>
            <Button onClick={() => void save()} disabled={busy}>
              Save
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
