import { userRepository, taskRepository, taskLogRepository } from "@/infrastructure/prisma/repositories";
import { listTasksWithStats } from "@/application/list-tasks-with-stats.usecase";
import { AdminTable } from "@/components/admin-table";

export default async function AdminTasksPage() {
  const tasks = await listTasksWithStats(userRepository, taskRepository, taskLogRepository);

  return (
    <AdminTable
      title="Tâches"
      rows={tasks}
      emptyMessage="Aucune tâche."
      rowKey={(task) => task.taskId}
      columns={[
        { header: "Tâche", render: (task) => task.label, className: "text-cozy-brown" },
        { header: "Propriétaire", render: (task) => task.ownerEmail },
        { header: "Nb de logs", render: (task) => task.totalLogs },
        {
          header: "Créée le",
          render: (task) => task.createdAt.toLocaleDateString("fr-FR"),
        },
      ]}
    />
  );
}
