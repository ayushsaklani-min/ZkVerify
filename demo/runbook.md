# zkVerify Demo Runbook

Total duration: ~2 minutes

1. **Admin Authentication (20s)**
   - Open `/admin` dashboard.
   - Connect the designated admin wallet and click **Authenticate as Admin**.
   - Show the issued JWT banner and the pending auditor queue.

2. **Approve Auditor (30s)**
   - Select a pending application.
   - Click **Approve** to trigger on-chain approval and credibility issuance.
   - Highlight the updated status badge and credibility signature tooltips.

3. **Auditor Issues Credential (30s)**
   - Switch to `/auditor` page with the approved wallet.
   - Fill in project details and issue a credential (AIR proxy + signature required).
   - Anchor the credential on-chain; point out the transaction hash.

4. **Project Generates Proof (20s)**
   - On `/project`, load the issued credential, generate the ZK proof (<3s).
   - Display the proof statistics (size, duration) and the on-chain credential hash.

5. **Investor Verifies Status (20s)**
   - Submit the proof for on-chain verification and show the success banner.
   - Navigate to `/verify` and demonstrate the publicly visible audit status plus auditor credibility score.

6. **Metrics & Transparency (20s)**
   - Open `/metrics` to review real-time proof latency, gas consumption, and success rate charts.
   - Mention that Slither reports and CI logs are available under `/security` and the GitHub Actions CI tab.



