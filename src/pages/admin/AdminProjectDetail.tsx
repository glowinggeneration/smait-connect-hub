import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectPhasesView } from "@/components/projects/ProjectPhasesView";
import { mockProject, Project } from "@/types/project";
import { useNavigate } from "react-router-dom";

const AdminProjectDetail = () => {
  const navigate = useNavigate();
  const [project, setProject] = useState<Project>(mockProject);

  const handleUpdateProject = (updatedProject: Project) => {
    setProject(updatedProject);
    // In a real app, this would save to the backend
    console.log("Project updated:", updatedProject);
  };

  return (
    <DashboardLayout userType="admin">
      <ProjectPhasesView
        project={project}
        isAdmin={true}
        onBack={() => navigate("/admin")}
        onUpdateProject={handleUpdateProject}
      />
    </DashboardLayout>
  );
};

export default AdminProjectDetail;
