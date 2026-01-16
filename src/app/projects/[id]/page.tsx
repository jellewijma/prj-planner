import { getProjectGraph } from "@/server/db/projects";
import { ProjectDiagram } from "@/components/projects/ProjectDiagram";

export default async function ProjectPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const graph = getProjectGraph(id);

  return <ProjectDiagram initialGraph={graph} />;
}
