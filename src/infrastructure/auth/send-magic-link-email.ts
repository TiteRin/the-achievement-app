import { createTransport } from "nodemailer";
import type { NodemailerConfig } from "next-auth/providers/nodemailer";
import type { UserRepository } from "@/domain/user/user.repository";

export async function sendMagicLinkEmail(
  userRepository: UserRepository,
  params: {
    identifier: string;
    url: string;
    provider: Pick<NodemailerConfig, "server" | "from">;
  }
): Promise<void> {
  const existing = await userRepository.findByEmail(params.identifier);
  if (!existing) {
    // No account: stay silent. Auth.js still redirects to the same
    // confirmation page either way, so no email = no info leak.
    return;
  }

  const transport = createTransport(params.provider.server);
  const result = await transport.sendMail({
    to: params.identifier,
    from: params.provider.from,
    subject: "Connexion à The Achievement App",
    text: `Clique sur ce lien pour te connecter : ${params.url}`,
    html: `<p>Clique sur ce lien pour te connecter à The Achievement App :</p><p><a href="${params.url}">${params.url}</a></p>`,
  });

  const failed = [...(result.rejected ?? []), ...(result.pending ?? [])].filter(Boolean);
  if (failed.length) {
    throw new Error(`Email (${failed.join(", ")}) could not be sent`);
  }
}
