import { ProjectsHome } from "@/components/projects/ProjectsHome";
import { listProjects } from "@/server/db/projects";

export const dynamic = "force-dynamic";

export default function Home() {
  const projects = listProjects();

  return <ProjectsHome initialProjects={projects} />;
}
