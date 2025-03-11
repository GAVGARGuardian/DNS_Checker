import { DnsRecordChecker } from "@/components/dns-record-checker"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="w-full max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">DNS Record Checker</h1>
        <p className="text-center text-muted-foreground mb-8">Check DMARC, SPF, and DKIM records for any domain</p>
        <DnsRecordChecker />
      </div>
    </main>
  )
}

