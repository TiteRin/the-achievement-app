import { userRepository } from "@/infrastructure/prisma/repositories";
import { listAccounts } from "@/application/list-accounts.usecase";
import { AdminTable } from "@/components/admin-table";

export default async function AdminAccountsPage() {
  const accounts = await listAccounts(userRepository);

  return (
    <AdminTable
      title="Comptes"
      rows={accounts}
      emptyMessage="Aucun compte."
      rowKey={(account) => account.id}
      columns={[
        { header: "Email", render: (account) => account.email, className: "text-cozy-brown" },
        {
          header: "Rôle",
          render: (account) =>
            account.role === "admin" ? (
              <span className="rounded-full bg-cozy-coral-soft px-2 py-0.5 text-xs font-semibold text-cozy-coral">
                admin
              </span>
            ) : (
              <span className="text-cozy-brown-soft">user</span>
            ),
        },
        { header: "Fuseau horaire", render: (account) => account.timezone },
        {
          header: "Créé le",
          render: (account) => account.createdAt.toLocaleDateString("fr-FR"),
        },
      ]}
    />
  );
}
