# Backup and Restore Testing Procedure

## Overview

Comprehensive backup strategy with documented RPO/RTO and tested restore procedures.

**Goals:**
- Prevent data loss (contributions, donor information, audit logs)
- Enable fast recovery from catastrophic failures
- Maintain compliance with audit requirements

## Recovery Objectives

### RPO (Recovery Point Objective)

**How much data can we afford to lose?**

| Data Type | RPO | Backup Frequency |
|-----------|-----|------------------|
| **Contributions** | 5 minutes | Continuous (database replication) |
| **Donor information** | 5 minutes | Continuous (database replication) |
| **Audit logs** | 1 hour | Hourly snapshots + daily S3 backup |
| **Content** | 24 hours | Daily snapshots |
| **Configuration** | 24 hours | Daily snapshots |

### RTO (Recovery Time Objective)

**How quickly must we recover?**

| Failure Scenario | RTO | Recovery Method |
|------------------|-----|-----------------|
| **Database corruption** | 15 minutes | Restore from automated backup |
| **Accidental deletion** | 30 minutes | Point-in-time recovery |
| **Complete infrastructure loss** | 4 hours | Rebuild from backups + git |
| **Region outage** | 1 hour | Failover to read replica |

## Backup Strategy

### Database Backups (PostgreSQL)

**Provider**: Vercel Postgres (Neon) or managed PostgreSQL (AWS RDS, Supabase)

**Automated backups:**
1. **Continuous replication**: Real-time to read replica
2. **Automated snapshots**: Daily at 2:00 AM UTC
3. **Point-in-time recovery**: Restore to any second in last 7 days
4. **Long-term archives**: Weekly exports to S3 (encrypted)

**Retention**:
- Automated snapshots: 30 days
- S3 archives: 7 years (compliance requirement)

### Audit Log Backups

**Why separate**: Audit logs must be immutable and long-lived per election law.

**Strategy:**
1. **Database table**: `AuditLog` (primary storage)
2. **Daily S3 export**: Encrypted, immutable (versioning + object lock)
3. **Lifecycle policy**: Transition to Glacier after 90 days

**S3 bucket configuration:**
```json
{
  "Name": "diaspora4bellefleur-audit-logs",
  "Versioning": "Enabled",
  "ObjectLock": "Enabled (Compliance mode, 7 years)",
  "Encryption": "AES-256",
  "Lifecycle": [
    {
      "Transition": "Glacier after 90 days"
    }
  ]
}
```

**Export cron job**: Daily at 3:00 AM UTC (see `vercel.json` cron)

**Script**: `scripts/backup-audit-logs.ts`

```typescript
// scripts/backup-audit-logs.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { prisma } from '../src/lib/db/prisma'
import { createCipheriv, randomBytes } from 'crypto'

export async function backupAuditLogs() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const today = new Date()
  
  // Fetch yesterday's audit logs
  const logs = await prisma.auditLog.findMany({
    where: {
      createdAt: {
        gte: yesterday,
        lt: today,
      },
    },
    orderBy: { createdAt: 'asc' },
  })
  
  if (logs.length === 0) {
    console.log('No audit logs to backup')
    return
  }
  
  // Encrypt logs
  const key = Buffer.from(process.env.BACKUP_ENCRYPTION_KEY!, 'hex')
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-cbc', key, iv)
  
  const logsJson = JSON.stringify(logs, null, 2)
  let encrypted = cipher.update(logsJson, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  // Upload to S3
  const s3 = new S3Client({ region: 'us-east-1' })
  const filename = `audit-logs-${yesterday.toISOString().split('T')[0]}.json.enc`
  
  await s3.send(new PutObjectCommand({
    Bucket: 'diaspora4bellefleur-audit-logs',
    Key: `backups/${filename}`,
    Body: JSON.stringify({
      iv: iv.toString('hex'),
      data: encrypted,
      timestamp: today.toISOString(),
      recordCount: logs.length,
    }),
    ServerSideEncryption: 'AES256',
    Metadata: {
      'backup-date': yesterday.toISOString().split('T')[0],
      'record-count': logs.length.toString(),
    },
  }))
  
  console.log(`✓ Backed up ${logs.length} audit logs to S3: ${filename}`)
}
```

### Application Backups

**Git repository**: Source of truth for code, configs, migrations

**What to backup**:
- ✅ Source code (git)
- ✅ Database schema (Prisma migrations in git)
- ✅ Environment variables (documented in ENVIRONMENT_VARIABLES.md, values in Vercel secret manager)
- ✅ Configuration files (git)

**What NOT to backup**:
- ❌ `node_modules` (reproducible via `npm install`)
- ❌ `.next/` build artifacts (reproducible via `npm run build`)
- ❌ Secrets (stored in Vercel, not in git)

### File Storage Backups

**If using S3 for uploads (candidate photos, documents):**

**Strategy**:
- Versioning enabled (protects against accidental deletion)
- Cross-region replication (disaster recovery)
- Lifecycle policy (transition old versions to Glacier)

**S3 bucket configuration:**
```json
{
  "Name": "diaspora4bellefleur-uploads",
  "Versioning": "Enabled",
  "Replication": {
    "Destination": "s3://diaspora4bellefleur-uploads-replica (us-west-2)"
  },
  "Lifecycle": [
    {
      "NoncurrentVersionTransition": "Glacier after 30 days"
    }
  ]
}
```

## Backup Verification

### Automated Verification

**Daily backup validation** (runs after each backup):

```typescript
// scripts/verify-backup.ts
export async function verifyBackup(backupId: string) {
  // 1. Check backup exists
  const backup = await getBackup(backupId)
  if (!backup) {
    throw new Error(`Backup ${backupId} not found`)
  }
  
  // 2. Check backup size (should be >1MB for production database)
  if (backup.size < 1024 * 1024) {
    throw new Error(`Backup ${backupId} suspiciously small: ${backup.size} bytes`)
  }
  
  // 3. Check backup age (should be <2 hours old)
  const age = Date.now() - backup.createdAt.getTime()
  if (age > 2 * 60 * 60 * 1000) {
    throw new Error(`Backup ${backupId} too old: ${age}ms`)
  }
  
  // 4. Verify encryption (if encrypted)
  if (backup.encrypted) {
    await verifyEncryption(backup)
  }
  
  console.log(`✓ Backup ${backupId} verified`)
}
```

**Alert if verification fails**: Email to SUPPORT_EMAIL + Slack

### Manual Verification (Monthly)

**Checklist**:
- [ ] Latest database snapshot exists (< 24 hours old)
- [ ] Audit log S3 backup exists (yesterday's date)
- [ ] S3 versioning enabled
- [ ] S3 object lock enabled (audit logs)
- [ ] Backup encryption keys accessible
- [ ] Backup size reasonable (not 0 bytes)

**Script to check**:
```bash
#!/bin/bash
# scripts/check-backups.sh

echo "=== Backup Health Check ==="
echo ""

# Check database backups (Vercel Postgres)
echo "1. Database backups:"
# TODO: Add Vercel API call or provider-specific check
echo "   [Manual check required in Vercel dashboard]"
echo ""

# Check S3 audit log backups
echo "2. Audit log backups (S3):"
YESTERDAY=$(date -u -d "yesterday" +%Y-%m-%d)
aws s3 ls s3://diaspora4bellefleur-audit-logs/backups/ | grep $YESTERDAY
if [ $? -eq 0 ]; then
  echo "   ✓ Yesterday's backup exists"
else
  echo "   ✗ Yesterday's backup MISSING"
fi
echo ""

# Check S3 versioning
echo "3. S3 versioning:"
aws s3api get-bucket-versioning --bucket diaspora4bellefleur-audit-logs | grep -q "Enabled"
if [ $? -eq 0 ]; then
  echo "   ✓ Enabled"
else
  echo "   ✗ Disabled"
fi
echo ""

# Check S3 object lock
echo "4. S3 object lock:"
aws s3api get-object-lock-configuration --bucket diaspora4bellefleur-audit-logs
if [ $? -eq 0 ]; then
  echo "   ✓ Enabled"
else
  echo "   ✗ Disabled or not configured"
fi
echo ""

echo "=== Check Complete ==="
```

## Restore Procedures

### Scenario 1: Restore Single Deleted Record

**Example**: Admin accidentally deletes a contribution record

**Steps**:

1. **Identify deletion time** (from audit log):
   ```sql
   SELECT * FROM "AuditLog"
   WHERE action = 'CONTRIBUTION_DELETED'
   ORDER BY "createdAt" DESC
   LIMIT 10;
   ```

2. **Find record in backup** (point-in-time before deletion):
   - Use database provider's point-in-time recovery UI
   - Restore to temporary database
   - Query for deleted record

3. **Re-insert record**:
   ```sql
   -- From temporary restored database
   SELECT * FROM "Contribution" WHERE id = 'clx123abc';
   
   -- Copy data to production
   INSERT INTO "Contribution" (...)
   VALUES (...);
   ```

4. **Verify**:
   ```sql
   SELECT * FROM "Contribution" WHERE id = 'clx123abc';
   -- Should exist with original data
   ```

5. **Audit log the restore**:
   ```typescript
   await prisma.auditLog.create({
     data: {
       action: 'CONTRIBUTION_RESTORED',
       entityType: 'Contribution',
       entityId: 'clx123abc',
       changes: { restoredFrom: 'backup-2026-11-17T14:32:00Z' },
       userId: admin.id,
       reason: 'Accidental deletion by admin, restored from backup',
     },
   })
   ```

**RTO**: 30 minutes  
**RPO**: Up to 5 minutes data loss

### Scenario 2: Restore Entire Database

**Example**: Database corrupted, all data inaccessible

**Steps**:

1. **Stop application** (prevent writes to corrupted database):
   ```bash
   # In Vercel dashboard: Disable domains temporarily
   # Or: Kill switch (see LAUNCH_GATE.md)
   ```

2. **Create new database instance**:
   - Provision new Vercel Postgres database
   - Copy connection string

3. **Restore from backup**:
   
   **Option A: Automated snapshot (fastest)**
   ```bash
   # Via Vercel dashboard or CLI
   vercel postgres restore <backup-id> --to <new-database-id>
   ```
   
   **Option B: S3 archive (if recent backups unavailable)**
   ```bash
   # Download backup
   aws s3 cp s3://diaspora4bellefleur-backups/db-2026-11-17.sql.gz ./
   
   # Decompress
   gunzip db-2026-11-17.sql.gz
   
   # Restore
   psql $NEW_DATABASE_URL < db-2026-11-17.sql
   ```

4. **Run migrations** (in case backup schema is old):
   ```bash
   DATABASE_URL=$NEW_DATABASE_URL npx prisma migrate deploy
   ```

5. **Verify data integrity**:
   ```sql
   -- Check row counts
   SELECT 'Contributions' as table, COUNT(*) FROM "Contribution"
   UNION ALL
   SELECT 'Users', COUNT(*) FROM "User"
   UNION ALL
   SELECT 'AuditLog', COUNT(*) FROM "AuditLog";
   
   -- Verify recent contributions exist
   SELECT * FROM "Contribution"
   ORDER BY "createdAt" DESC
   LIMIT 10;
   ```

6. **Update Vercel environment variables**:
   ```bash
   vercel env add DATABASE_URL production
   # Paste new connection string
   ```

7. **Deploy** (triggers rebuild with new database):
   ```bash
   vercel --prod
   ```

8. **Re-enable application**:
   - Re-enable domains in Vercel
   - Or: Deactivate kill switch

9. **Test critical flows**:
   - Admin login
   - Contribution submission (test mode)
   - Receipt generation
   - Audit log recording

10. **Notify stakeholders**:
    - Send email to SUPPORT_EMAIL list
    - Update status page
    - Document incident (see INCIDENT_RESPONSE.md)

**RTO**: 2-4 hours (depending on database size)  
**RPO**: Up to 24 hours data loss (if using daily snapshots)

### Scenario 3: Restore Audit Logs from S3

**Example**: Need audit logs from 2 years ago for compliance audit

**Steps**:

1. **List available backups**:
   ```bash
   aws s3 ls s3://diaspora4bellefleur-audit-logs/backups/ | grep "2024-11"
   ```

2. **Download encrypted backup**:
   ```bash
   aws s3 cp s3://diaspora4bellefleur-audit-logs/backups/audit-logs-2024-11-15.json.enc ./
   ```

3. **Decrypt**:
   ```typescript
   // scripts/decrypt-audit-logs.ts
   import { createDecipheriv } from 'crypto'
   import { readFileSync, writeFileSync } from 'fs'
   
   const encryptedFile = readFileSync('./audit-logs-2024-11-15.json.enc', 'utf8')
   const { iv, data } = JSON.parse(encryptedFile)
   
   const key = Buffer.from(process.env.BACKUP_ENCRYPTION_KEY!, 'hex')
   const decipher = createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'))
   
   let decrypted = decipher.update(data, 'hex', 'utf8')
   decrypted += decipher.final('utf8')
   
   writeFileSync('./audit-logs-2024-11-15.json', decrypted)
   console.log('✓ Decrypted to audit-logs-2024-11-15.json')
   ```

4. **Query logs**:
   ```bash
   # Parse JSON and search
   jq '.[] | select(.action == "CONTRIBUTION_CREATED")' audit-logs-2024-11-15.json
   ```

5. **Provide to auditor** (if required):
   - Export to CSV or PDF
   - Redact sensitive fields if needed
   - Sign and timestamp

**RTO**: 30 minutes  
**RPO**: N/A (archival data)

### Scenario 4: Complete Infrastructure Loss

**Example**: Vercel account compromised, all projects deleted

**Steps**:

1. **Create new Vercel account**:
   - Sign up with backup email
   - Verify identity

2. **Clone git repository**:
   ```bash
   git clone https://github.com/your-org/diaspora4bellefleur.git
   cd diaspora4bellefleur
   ```

3. **Provision new infrastructure**:
   - Create new Vercel project
   - Create new database (Vercel Postgres or external)
   - Create new S3 buckets (if using)

4. **Restore database from S3 archive**:
   ```bash
   # Download latest weekly backup
   aws s3 cp s3://diaspora4bellefleur-backups/weekly/db-2026-11-15.sql.gz ./
   
   # Restore (see Scenario 2)
   ```

5. **Configure environment variables**:
   ```bash
   # All variables from ENVIRONMENT_VARIABLES.md
   vercel env add DATABASE_URL production
   vercel env add STRIPE_SECRET_KEY production
   # ...
   ```

6. **Deploy**:
   ```bash
   vercel --prod
   ```

7. **Update DNS**:
   - Point domain to new Vercel deployment
   - Verify DNS propagation

8. **Restore audit logs from S3**:
   - Download all backup files
   - Import into new database

9. **Verify full functionality**:
   - Run full smoke test suite
   - Manually test all critical flows

10. **Post-incident review**:
    - Document what happened
    - Update security procedures
    - Notify affected parties

**RTO**: 4-8 hours (depending on database size and complexity)  
**RPO**: Up to 7 days data loss (if relying on weekly backups)

## Testing Schedule

### Quarterly Restore Test (Required)

**Objective**: Verify backups are restorable and data is intact

**Frequency**: Every 3 months (January, April, July, October)

**Procedure**:

1. **Schedule test** (announce to team, avoid production disruptions)
2. **Provision test database**
3. **Restore latest backup to test database**
4. **Run verification queries** (row counts, recent records)
5. **Test application against restored database** (read-only)
6. **Document results** in `docs/backup-tests/YYYY-MM-DD.md`
7. **Clean up test resources**

**Success criteria**:
- ✅ Backup restores without errors
- ✅ Row counts match expected (±5%)
- ✅ Recent contributions visible
- ✅ Audit logs intact
- ✅ Application can connect and query

**Time estimate**: 2 hours

### Annual Disaster Recovery Drill (Recommended)

**Objective**: Full infrastructure rebuild from backups

**Frequency**: Annually (suggested: Q1, before election season)

**Procedure**:

1. **Schedule drill** (full team participation)
2. **Simulate disaster** (create new isolated Vercel account)
3. **Follow "Complete Infrastructure Loss" procedure** (Scenario 4)
4. **Measure RTO** (start to fully functional)
5. **Identify gaps** in documentation or procedures
6. **Update runbooks** based on lessons learned
7. **Document results** in `docs/disaster-recovery-drills/YYYY.md`

**Success criteria**:
- ✅ Infrastructure rebuilt in < 8 hours
- ✅ All critical flows functional
- ✅ Data loss < 7 days
- ✅ No undocumented steps encountered

**Time estimate**: Full day (8 hours)

## Backup Security

### Encryption

**Database backups**:
- Encrypted at rest (AES-256, managed by provider)
- Encrypted in transit (TLS 1.3)

**Audit log backups**:
- Application-level encryption (AES-256-CBC)
- Separate encryption key from database password
- Key stored in Vercel environment (not in git)

**Key management**:
- Primary key: Vercel secret manager
- Backup key: Stored offline (password manager, safe)
- Rotation: Every 90 days (see ENVIRONMENT_VARIABLES.md)

### Access Control

**Database backups**:
- Only OWNER role can trigger manual backups
- Only OWNER and COMPLIANCE roles can restore

**S3 audit backups**:
- IAM policy: Only backup service user can write
- IAM policy: COMPLIANCE role can read
- Object lock: Cannot be deleted (even by root user)

**Restore access**:
- Requires 2-person approval (OWNER + COMPLIANCE)
- All restores audit-logged
- Restoration reason required

### Compliance

**Retention periods**:
- Operational backups: 30 days
- Audit logs: 7 years (Haiti election law)
- Financial records: 7 years

**Geographic restrictions**:
- Database backups: Same region as primary (or paired region)
- Audit logs: US-only (S3 bucket region: us-east-1)
- No data stored in sanctioned countries

## Monitoring Backup Health

### Daily Checks (Automated)

- ✅ Last backup completed < 24 hours ago
- ✅ Backup size > 1MB
- ✅ S3 audit backup exists for yesterday
- ✅ Encryption keys accessible

**Alert if any check fails**: Email to SUPPORT_EMAIL

### Weekly Checks (Manual)

- [ ] Review backup logs for errors
- [ ] Verify backup retention policies
- [ ] Check S3 bucket versioning enabled
- [ ] Verify backup size trend (should grow with data)

### Monthly Checks (Manual)

- [ ] Run manual restore test (see "Quarterly Restore Test")
- [ ] Verify backup encryption keys
- [ ] Review access logs (who accessed backups)
- [ ] Update disaster recovery contact list

## Cost Estimates

### Database Backups

**Vercel Postgres**:
- Automated backups: Included (30-day retention)
- Point-in-time recovery: Included

**External PostgreSQL (AWS RDS)**:
- Automated backups: $0.095/GB-month (us-east-1)
- Snapshots: $0.095/GB-month
- Estimate: ~$5/month for 50GB database

### S3 Storage

**Audit log backups**:
- Standard storage: $0.023/GB-month
- Glacier (after 90 days): $0.004/GB-month
- Estimate: ~$2/month for 7 years of audit logs (100MB/month growth)

**File uploads** (if applicable):
- Standard storage: $0.023/GB-month
- Versioning overhead: +20% storage cost
- Estimate: ~$5/month for 200GB

**Total estimated**: $12-15/month

## External Resources

- [Vercel Postgres Backups](https://vercel.com/docs/storage/vercel-postgres/usage-and-pricing#backups)
- [AWS RDS Backups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html)
- [S3 Object Lock](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html)
- [PostgreSQL Backup Best Practices](https://www.postgresql.org/docs/current/backup.html)

---

**Last Updated**: November 18, 2026

**Next Restore Test Due**: (Calculate 3 months from first production deployment)
