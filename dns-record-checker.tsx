"use client"

import type React from "react"

import { useState } from "react"
import { CheckCircle, Copy, ExternalLink, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { checkDnsRecords } from "@/lib/actions"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

type RecordType = "dmarc" | "spf" | "dkim"
type RecordStatus = "valid" | "invalid" | "missing"

interface DnsRecord {
  type: RecordType
  status: RecordStatus
  value: string
  explanation: string
}

export function DnsRecordChecker() {
  const [domain, setDomain] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [records, setRecords] = useState<DnsRecord[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!domain) {
      setError("Please enter a domain")
      return
    }

    setIsChecking(true)
    setError(null)

    try {
      const result = await checkDnsRecords(domain)
      setRecords(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check DNS records")
    } finally {
      setIsChecking(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The record value has been copied to your clipboard",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enter Domain</CardTitle>
          <CardDescription>Enter a domain name to check its DMARC, SPF, and DKIM records</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isChecking}>
              {isChecking ? "Checking..." : "Check Records"}
            </Button>
          </form>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {isChecking && (
        <Card>
          <CardHeader>
            <CardTitle>Checking Records</CardTitle>
            <CardDescription>Please wait while we check the DNS records</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>DMARC Record</span>
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>SPF Record</span>
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>DKIM Record</span>
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {records && !isChecking && (
        <Card>
          <CardHeader>
            <CardTitle>DNS Records for {domain}</CardTitle>
            <CardDescription>Results of DMARC, SPF, and DKIM record checks</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="dmarc">DMARC</TabsTrigger>
                <TabsTrigger value="spf">SPF</TabsTrigger>
                <TabsTrigger value="dkim">DKIM</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4 mt-4">
                {records.map((record) => (
                  <div key={record.type} className="flex items-start gap-2 p-4 border rounded-lg">
                    {record.status === "valid" ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium">{record.type.toUpperCase()} Record</h3>
                      <p className="text-sm text-muted-foreground">{record.explanation}</p>
                    </div>
                    <div className="text-sm font-medium">
                      {record.status === "valid" ? (
                        <span className="text-green-500">Valid</span>
                      ) : record.status === "missing" ? (
                        <span className="text-red-500">Missing</span>
                      ) : (
                        <span className="text-red-500">Invalid</span>
                      )}
                    </div>
                  </div>
                ))}
              </TabsContent>

              {records.map((record) => (
                <TabsContent key={record.type} value={record.type} className="space-y-4 mt-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{record.type.toUpperCase()} Record</h3>
                      <div className="text-sm font-medium">
                        {record.status === "valid" ? (
                          <span className="text-green-500">Valid</span>
                        ) : record.status === "missing" ? (
                          <span className="text-red-500">Missing</span>
                        ) : (
                          <span className="text-red-500">Invalid</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{record.explanation}</p>

                    {record.status !== "missing" && (
                      <div className="relative">
                        <div className="p-3 bg-muted rounded-md text-sm font-mono break-all">{record.value}</div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(record.value)}
                        >
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Copy to clipboard</span>
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">What is a {record.type.toUpperCase()} record?</h3>
                    {record.type === "dmarc" && (
                      <p className="text-sm text-muted-foreground">
                        DMARC (Domain-based Message Authentication, Reporting, and Conformance) is an email
                        authentication protocol that builds on SPF and DKIM. It allows domain owners to specify how
                        email that fails authentication should be handled, and provides reporting capabilities.
                      </p>
                    )}
                    {record.type === "spf" && (
                      <p className="text-sm text-muted-foreground">
                        SPF (Sender Policy Framework) is an email authentication method designed to detect forging
                        sender addresses during the delivery of email. SPF allows domain owners to specify which mail
                        servers are authorized to send email on behalf of their domain.
                      </p>
                    )}
                    {record.type === "dkim" && (
                      <p className="text-sm text-muted-foreground">
                        DKIM (DomainKeys Identified Mail) is an email authentication method designed to detect email
                        spoofing. It allows the receiver to check that an email claimed to have come from a specific
                        domain was indeed authorized by the owner of that domain.
                      </p>
                    )}
                    <Button variant="link" className="p-0 h-auto mt-2" asChild>
                      <a
                        href={`https://mxtoolbox.com/${record.type === "dmarc" ? "dmarc" : record.type === "spf" ? "spf" : "dkim"}/${domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Check with MX Toolbox <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <p className="text-sm text-muted-foreground">Last checked: {new Date().toLocaleString()}</p>
            <Button variant="outline" onClick={() => setRecords(null)}>
              Check Another Domain
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

