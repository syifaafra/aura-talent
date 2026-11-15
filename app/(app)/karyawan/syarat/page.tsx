import { NoProfile, profileLine } from "@/components/profile";
import { Card, Pill, Stat, Table, Td, Th } from "@/components/ui";
import { PageHeader } from "@/components/ui";
import { fmtLong } from "@/lib/db";
import { checklist } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Syarat Promosi · AURA Talent" };

export default async function SyaratPage() {
  const { employee: e } = await requireRole("karyawan");
  if (!e) return <NoProfile />;
  const items = checklist(e);
  const met = items.filter((i) => i.state === "Memenuhi").length;
  const waiting = items.length - met;

  return (
    <>
      <PageHeader title="Status pemenuhan syarat promosi" subtitle={profileLine(e)} />
      <div className="mb-6 grid gap-6 md:grid-cols-3">
        <Stat label="Syarat awal" value={<span className="text-[1.9rem]">{met} syarat terpenuhi</span>} />
        <Stat
          label="Tindak lanjut"
          tone="warn"
          value={<span className="text-[1.9rem]">{waiting} syarat menunggu</span>}
        />
        <Stat
          label="Status keseluruhan"
          tone={waiting ? "warn" : "ok"}
          value={<span className="text-[1.9rem]">{waiting ? "Menunggu kelengkapan" : "Lengkap"}</span>}
        />
      </div>

      <Card>
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 className="text-[1.5rem] font-semibold">Checklist syarat promosi</h2>
          <span className="text-base text-muted">Data per {fmtLong("2026-10-31")}</span>
        </div>
        <Table>
          <thead className="bg-brand-soft">
            <tr>
              <Th>Persyaratan</Th>
              <Th>Keterangan pemenuhan</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.key}>
                <Td className="font-medium">{i.label}</Td>
                <Td className="text-muted">{i.detail}</Td>
                <Td>
                  <Pill tone={i.state === "Memenuhi" ? "ok" : "warn"}>{i.state}</Pill>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
