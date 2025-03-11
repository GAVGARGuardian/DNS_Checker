# DNS_Checker

https://v0.dev/chat/dns-record-checker-T4Vnnspcrcq?b=b_0kwUVWBMqul

## How It Works

This DNS Record Checker application allows you to check DMARC, SPF, and DKIM records for any domain:

1. **Enter a domain** in the input field and click "Check Records"
2. The application will perform DNS lookups for:

1. DMARC record (`_dmarc.domain.com`)
2. SPF record (TXT record on the domain root)
3. DKIM record (checks common selectors like `default._domainkey` and `selector1._domainkey`)



3. **View results** in a tabbed interface showing:

1. Summary of all records
2. Detailed information for each record type
3. Record values with copy functionality
4. Explanations of what each record type means





## Technical Details

- Uses Next.js with Server Actions to perform DNS lookups
- Built with shadcn/ui components for a clean, professional interface
- Responsive design works on all device sizes
- Provides visual indicators for record status (valid/invalid/missing)
- Includes loading states while checking records


Note that for DKIM records, the application checks common selectors (`default` and `selector1`), but in a real-world scenario, you would need to know the specific selector(s) used by the domain.
