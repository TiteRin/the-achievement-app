import { prisma } from "@/infrastructure/prisma/client";
import { PrismaUserRepository } from "@/infrastructure/prisma/prisma-user.repository";
import { listAccounts } from "@/application/list-accounts.usecase";

export default async function AdminAccountsPage() {
  const userRepository = new PrismaUserRepository(prisma);
  const accounts = await listAccounts(userRepository);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-cozy-brown">
        Comptes ({accounts.length})
      </h1>

      {accounts.length === 0 ? (
        <p className="text-cozy-brown-soft">Aucun compte.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-cozy-brown/10 text-cozy-brown-soft">
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Rôle</th>
              <th className="py-2 pr-4 font-medium">Fuseau horaire</th>
              <th className="py-2 font-medium">Créé le</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id} className="border-b border-cozy-brown/5">
                <td className="py-2 pr-4 text-cozy-brown">{account.email}</td>
                <td className="py-2 pr-4">
                  {account.role === "admin" ? (
                    <span className="rounded-full bg-cozy-coral-soft px-2 py-0.5 text-xs font-semibold text-cozy-coral">
                      admin
                    </span>
                  ) : (
                    <span className="text-cozy-brown-soft">user</span>
                  )}
                </td>
                <td className="py-2 pr-4 text-cozy-brown-soft">{account.timezone}</td>
                <td className="py-2 text-cozy-brown-soft">
                  {account.createdAt.toLocaleDateString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
