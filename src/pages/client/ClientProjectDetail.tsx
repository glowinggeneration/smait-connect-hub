import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectPhasesView } from "@/components/projects/ProjectPhasesView";
import { mockProject, Project } from "@/types/project";
import { useNavigate } from "react-router-dom";

const ClientProjectDetail = () => {
  const navigate = useNavigate();
  const [project] = useState<Project>(mockProject);

  return (
    <DashboardLayout userType="client">
      <ProjectPhasesView
        project={project}
        isAdmin={false}
        onBack={() => navigate("/client")}
      />
    </DashboardLayout>
  );
};

export default ClientProjectDetail;
