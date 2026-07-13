import { getFormatter, getTranslations } from "next-intl/server";
import { userRepository } from "@/infrastructure/prisma/repositories";
import { listAccounts } from "@/application/list-accounts.usecase";
import { AdminTable } from "@/components/admin-table";

export default async function AdminAccountsPage() {
  const accounts = await listAccounts(userRepository);
  const t = await getTranslations("admin.accounts");
  const format = await getFormatter();

  return (
    <AdminTable
      title={t("title")}
      rows={accounts}
      emptyMessage={t("empty")}
      rowKey={(account) => account.id}
      columns={[
        { header: t("email"), render: (account) => account.email, className: "text-cozy-brown" },
        {
          header: t("role"),
          render: (account) =>
            account.role === "admin" ? (
              <span className="rounded-full bg-cozy-coral-soft px-2 py-0.5 text-xs font-semibold text-cozy-coral">
                {t("roleAdmin")}
              </span>
            ) : (
              <span className="text-cozy-brown-soft">{t("roleUser")}</span>
            ),
        },
        { header: t("timezone"), render: (account) => account.timezone },
        {
          header: t("createdAt"),
          render: (account) => format.dateTime(account.createdAt, { dateStyle: "short" }),
        },
      ]}
    />
  );
}
