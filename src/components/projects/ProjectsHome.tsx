"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import type { ListProjectsRow } from "@/server/db/projects";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CreateProjectResponse = {
  project: { id: string };
  rootNode: { id: string };
};

type ImportResponse = {
  project: { id: string };
  nodesCount: number;
};

export function ProjectsHome({ initialProjects }: { initialProjects: ListProjectsRow[] }) {
  const router = useRouter();
  const importInputRef = useRef<HTMLInputElement>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function createProject() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? "Failed to create project");
      }

      const data = (await res.json()) as CreateProjectResponse;
      toast.success("Project created");
      router.push(`/projects/${data.project.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  async function handleImportFile(file: File) {
    setBusy(true);
    try {
      const jsonText = await file.text();
      const json = JSON.parse(jsonText) as unknown;

      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(json),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? "Failed to import project");
      }

      const data = (await res.json()) as ImportResponse;
      toast.success(`Imported project (${data.nodesCount} nodes)`);
      router.push(`/projects/${data.project.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Planner</h1>
            <p className="mt-1 text-sm text-muted-foreground">Diagram-first project planning.</p>
          </div>
          <div className="flex gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void handleImportFile(file);
                e.target.value = "";
              }}
            />
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => importInputRef.current?.click()}
            >
              Import JSON
            </Button>
            <Button disabled={busy} onClick={() => setCreateOpen(true)}>
              New Project
            </Button>
          </div>
        </div>

        {initialProjects.length === 0 ? (
          <div className="mt-12 rounded-lg border bg-card p-8 text-center">
            <div className="text-sm text-muted-foreground">No projects yet.</div>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              Create your first project
            </Button>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-3">
            {initialProjects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium">{p.title}</div>
                    {p.description ? (
                      <div className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {p.description}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground">{p.nodes_count} cards</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>Creates a new project with a root card.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1">
              <div className="text-sm font-medium">Title</div>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="LightConsole" />
            </div>
            <div className="grid gap-1">
              <div className="text-sm font-medium">Description</div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void createProject()} disabled={busy}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
