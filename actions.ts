"use server"

type RecordType = "dmarc" | "spf" | "dkim"
type RecordStatus = "valid" | "invalid" | "missing"

interface DnsRecord {
  type: RecordType
  status: RecordStatus
  value: string
  explanation: string
}

export async function checkDnsRecords(domain: string): Promise<DnsRecord[]> {
  if (!domain) {
    throw new Error("Domain is required")
  }

  // Clean the domain (remove protocol, path, etc.)
  domain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0]

  const results: DnsRecord[] = []

  // Check DMARC record
  try {
    const dmarcResponse = await fetch(`https://dns.google/resolve?name=_dmarc.${domain}&type=TXT`)
    const dmarcData = await dmarcResponse.json()

    if (dmarcData.Answer && dmarcData.Answer.length > 0) {
      const dmarcRecords = dmarcData.Answer.map((record: any) => record.data.replace(/"/g, ""))
      const dmarcRecord = dmarcRecords.find((record: string) => record.startsWith("v=DMARC1"))

      if (dmarcRecord) {
        results.push({
          type: "dmarc",
          status: "valid",
          value: dmarcRecord,
          explanation: "DMARC record found and appears to be valid.",
        })
      } else {
        results.push({
          type: "dmarc",
          status: "invalid",
          value: dmarcRecords.join("\n"),
          explanation: "DMARC record exists but doesn't contain the required 'v=DMARC1' tag.",
        })
      }
    } else {
      results.push({
        type: "dmarc",
        status: "missing",
        value: "",
        explanation: "No DMARC record found. DMARC helps prevent email spoofing and phishing.",
      })
    }
  } catch (error) {
    results.push({
      type: "dmarc",
      status: "missing",
      value: "",
      explanation: "Error checking DMARC record. DMARC helps prevent email spoofing and phishing.",
    })
  }

  // Check SPF record
  try {
    const spfResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=TXT`)
    const spfData = await spfResponse.json()

    if (spfData.Answer && spfData.Answer.length > 0) {
      const spfRecords = spfData.Answer.map((record: any) => record.data.replace(/"/g, ""))
      const spfRecord = spfRecords.find((record: string) => record.startsWith("v=spf1"))

      if (spfRecord) {
        results.push({
          type: "spf",
          status: "valid",
          value: spfRecord,
          explanation: "SPF record found and appears to be valid.",
        })
      } else {
        results.push({
          type: "spf",
          status: "invalid",
          value: spfRecords.join("\n"),
          explanation: "TXT records exist but no valid SPF record with 'v=spf1' tag was found.",
        })
      }
    } else {
      results.push({
        type: "spf",
        status: "missing",
        value: "",
        explanation:
          "No SPF record found. SPF specifies which mail servers are authorized to send email from your domain.",
      })
    }
  } catch (error) {
    results.push({
      type: "spf",
      status: "missing",
      value: "",
      explanation:
        "Error checking SPF record. SPF specifies which mail servers are authorized to send email from your domain.",
    })
  }

  // Check DKIM record (this is a simplified check as DKIM requires a selector)
  // In a real application, you would need to know the selector(s) used by the domain
  let dkimFound = false

  // Try with 'default' selector
  try {
    const dkimResponse = await fetch(`https://dns.google/resolve?name=default._domainkey.${domain}&type=TXT`)
    const dkimData = await dkimResponse.json()

    if (dkimData.Answer && dkimData.Answer.length > 0) {
      const dkimRecords = dkimData.Answer.map((record: any) => record.data.replace(/"/g, ""))
      const dkimRecord = dkimRecords.find((record: string) => record.includes("v=DKIM1"))

      if (dkimRecord) {
        results.push({
          type: "dkim",
          status: "valid",
          value: dkimRecord,
          explanation: "DKIM record found for selector 'default' and appears to be valid.",
        })
        dkimFound = true
      } else {
        results.push({
          type: "dkim",
          status: "invalid",
          value: dkimRecords.join("\n"),
          explanation: "DKIM record exists for selector 'default' but doesn't contain the required 'v=DKIM1' tag.",
        })
        dkimFound = true
      }
    }
  } catch (error) {
    // Continue to try other selectors
  }

  // If DKIM not found with 'default' selector, try with 'selector1'
  if (!dkimFound) {
    try {
      const dkimResponse = await fetch(`https://dns.google/resolve?name=selector1._domainkey.${domain}&type=TXT`)
      const dkimData = await dkimResponse.json()

      if (dkimData.Answer && dkimData.Answer.length > 0) {
        const dkimRecords = dkimData.Answer.map((record: any) => record.data.replace(/"/g, ""))
        const dkimRecord = dkimRecords.find((record: string) => record.includes("v=DKIM1"))

        if (dkimRecord) {
          results.push({
            type: "dkim",
            status: "valid",
            value: dkimRecord,
            explanation: "DKIM record found for selector 'selector1' and appears to be valid.",
          })
          dkimFound = true
        } else {
          results.push({
            type: "dkim",
            status: "invalid",
            value: dkimRecords.join("\n"),
            explanation: "DKIM record exists for selector 'selector1' but doesn't contain the required 'v=DKIM1' tag.",
          })
          dkimFound = true
        }
      }
    } catch (error) {
      // Continue to try other selectors or set as missing
    }
  }

  // If no DKIM record found with any selector
  if (!dkimFound) {
    results.push({
      type: "dkim",
      status: "missing",
      value: "",
      explanation:
        "No DKIM record found for common selectors. DKIM adds a digital signature to emails sent from your domain.",
    })
  }

  return results
}

