import { getFormatter, getTranslations } from "next-intl/server";
import { userRepository, taskRepository, taskLogRepository } from "@/infrastructure/prisma/repositories";
import { listTasksWithStats } from "@/application/list-tasks-with-stats.usecase";
import { AdminTable } from "@/components/admin-table";
import { TagList } from "@/components/tag-list";

export default async function AdminTasksPage() {
  const tasks = await listTasksWithStats(userRepository, taskRepository, taskLogRepository);
  const t = await getTranslations("admin.tasks");
  const format = await getFormatter();

  return (
    <AdminTable
      title={t("title")}
      rows={tasks}
      emptyMessage={t("empty")}
      rowKey={(task) => task.taskId}
      columns={[
        { header: t("label"), render: (task) => task.label, className: "text-cozy-brown" },
        { header: t("owner"), render: (task) => task.ownerEmail },
        { header: t("logCount"), render: (task) => task.totalLogs },
        {
          header: t("tags"),
          render: (task) =>
            task.tags.length > 0 ? <TagList tags={task.tags} /> : <span>{t("noTags")}</span>,
        },
        {
          header: t("createdAt"),
          render: (task) => format.dateTime(task.createdAt, { dateStyle: "short" }),
        },
      ]}
    />
  );
}
