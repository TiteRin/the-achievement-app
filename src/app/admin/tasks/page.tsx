import { prisma } from "@/infrastructure/prisma/client";
import { PrismaUserRepository } from "@/infrastructure/prisma/prisma-user.repository";
import { PrismaTaskRepository } from "@/infrastructure/prisma/prisma-task.repository";
import { PrismaTaskLogRepository } from "@/infrastructure/prisma/prisma-task-log.repository";
import { listTasksWithStats } from "@/application/list-tasks-with-stats.usecase";

export default async function AdminTasksPage() {
  const userRepository = new PrismaUserRepository(prisma);
  const taskRepository = new PrismaTaskRepository(prisma);
  const taskLogRepository = new PrismaTaskLogRepository(prisma);
  const tasks = await listTasksWithStats(
    userRepository,
    taskRepository,
    taskLogRepository
  );

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-cozy-brown">
        Tâches ({tasks.length})
      </h1>

      {tasks.length === 0 ? (
        <p className="text-cozy-brown-soft">Aucune tâche.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-cozy-brown/10 text-cozy-brown-soft">
              <th className="py-2 pr-4 font-medium">Tâche</th>
              <th className="py-2 pr-4 font-medium">Propriétaire</th>
              <th className="py-2 pr-4 font-medium">Nb de logs</th>
              <th className="py-2 font-medium">Créée le</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.taskId} className="border-b border-cozy-brown/5">
                <td className="py-2 pr-4 text-cozy-brown">{task.label}</td>
                <td className="py-2 pr-4 text-cozy-brown-soft">{task.ownerEmail}</td>
                <td className="py-2 pr-4 text-cozy-brown-soft">{task.totalLogs}</td>
                <td className="py-2 text-cozy-brown-soft">
                  {task.createdAt.toLocaleDateString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
