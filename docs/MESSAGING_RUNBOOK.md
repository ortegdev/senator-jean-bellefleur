# Messaging Engine Runbook

**Version**: 1.0  
**Last Updated**: November 18, 2026  
**Owner**: Campaign Operations Team

---

## Table of Contents

1. [Channel Setup](#channel-setup)
2. [Enabling Checklist](#enabling-checklist)
3. [Sending a Message](#sending-a-message)
4. [WhatsApp Channel Manual Publish](#whatsapp-channel-manual-publish)
5. [Incident Response](#incident-response)
6. [Monitoring](#monitoring)
7. [Common Issues](#common-issues)

---

## Channel Setup

### Email Channel

**Prerequisites**:
- Email provider account (Resend, Postmark, or SendGrid)
- Domain DNS configured (SPF, DKIM, DMARC)
- Sending subdomain (e.g., mail.diaspora4bellefleur.com)

**Steps**:

1. **Provider Setup**:
   ```bash
   # Choose provider
   EMAIL_PROVIDER="resend"  # or "postmark", "sendgrid"
   
   # Get API key from provider dashboard
   EMAIL_API_KEY="re_..."
   
   # Configure sender
   EMAIL_FROM_ADDRESS="hello@mail.diaspora4bellefleur.com"
   EMAIL_FROM_NAME="Diaspora4Bellefleur"
   ```

2. **DNS Records**:
   ```
   # SPF Record
   TXT @ "v=spf1 include:_spf.resend.com ~all"
   
   # DKIM Record (provided by email provider)
   TXT resend._domainkey.[your-domain] "v=DKIM1; k=rsa; p=..."
   
   # DMARC Record
   TXT _dmarc "v=DMARC1; p=quarantine; rua=mailto:dmarc@diaspora4bellefleur.com"
   ```

3. **Verify DNS**:
   ```bash
   dig TXT diaspora4bellefleur.com
   dig TXT resend._domainkey.diaspora4bellefleur.com
   ```

4. **Test Send**:
   - Go to `/admin/channels/email/test`
   - Enter admin email address
   - Send test message
   - Verify receipt and formatting

5. **Enable Channel**:
   ```bash
   CHANNEL_EMAIL_ENABLED="true"
   ```

### SMS Channel (Twilio)

**Prerequisites**:
- Twilio account with political messaging approved
- Campaign Verify registration (if required by carriers)
- SMS-enabled phone number or short code
- Legal counsel approval for SMS messaging

**Steps**:

1. **Twilio Account Setup**:
   - Create account at twilio.com
   - Complete business verification
   - Register for A2P 10DLC (if using long code)
   - Submit Campaign Verify registration (select "Political" as use case)
   - Wait for approval (can take 1-2 weeks)

2. **Get Credentials**:
   ```bash
   TWILIO_ACCOUNT_SID="AC..."
   TWILIO_AUTH_TOKEN="..."
   TWILIO_PHONE_NUMBER="+15551234567"
   ```

3. **Configure Webhooks**:
   - In Twilio console, configure phone number webhooks:
   - **Incoming Messages**: `https://your-domain.com/api/webhooks/sms/inbound`
   - **Status Callback**: `https://your-domain.com/api/webhooks/sms/status`

4. **Complete Compliance Checklist**:
   - [ ] SMS terms of service reviewed with legal counsel
   - [ ] Consent language approved
   - [ ] STOP/HELP keywords tested
   - [ ] Quiet hours configured (9pm-8am local time)
   - [ ] Message templates reviewed for length
   - [ ] Cost estimates calculated
   - [ ] Country allow-list configured

5. **Test Send**:
   - Go to `/admin/channels/sms/test`
   - Enter admin phone number
   - Send test message
   - Reply STOP and verify unsubscribe
   - Reply START and verify resubscribe
   - Reply HELP and verify help text

6. **Enable Channel**:
   ```bash
   CHANNEL_SMS_ENABLED="true"
   ```

### WhatsApp Channel (Manual Presence Only)

**Prerequisites**:
- WhatsApp Channel created via WhatsApp mobile app
- Channel invite link obtained
- Team member designated for manual posting

**Steps**:

1. **Create WhatsApp Channel** (on mobile app):
   - Open WhatsApp
   - Go to Updates tab
   - Tap "+" → "Create Channel"
   - Name: "Jean Fritznel Bellefleur for Nord-Ouest"
   - Add description and profile photo (if approved)
   - Make channel public
   - Copy channel invite link

2. **Configure in Admin**:
   - Go to `/admin/channels/whatsapp`
   - Paste channel invite link
   - Assign team member for posting
   - Review guidelines (NO automation checkbox)
   - Save configuration

3. **Test Manual Post**:
   - Create test message with WhatsApp variant
   - Assign to team member
   - Team member receives task with ready-to-paste text
   - Team member posts manually to Channel
   - Team member marks task as complete with post link

4. **Guidelines Review** (Required):
   - [ ] WhatsApp Business Platform will NEVER be used
   - [ ] No unofficial WhatsApp libraries will be used
   - [ ] All posts are manual via official WhatsApp app only
   - [ ] Posts include required disclosure text
   - [ ] Media is pre-sized for WhatsApp (see requirements below)

**WhatsApp Media Requirements**:
- **Images**: Max 5MB, recommended 1080x1080 (square) or 1920x1080 (landscape)
- **Videos**: Max 16MB, max 30 seconds, recommended 1080x1080

### Telegram Channel (Future)

**Prerequisites**:
- Telegram Bot created via BotFather
- Bot API token obtained

**Steps**:
1. Create bot via BotFather
2. Configure webhook
3. Test /start and /stop commands
4. Enable channel: `CHANNEL_TELEGRAM_ENABLED="true"`

### Web Push (Future)

**Prerequisites**:
- VAPID keys generated
- Service worker configured

**Steps**:
1. Generate VAPID keys
2. Configure service worker
3. Test permission prompt
4. Enable channel: `CHANNEL_WEB_PUSH_ENABLED="true"`

---

## Enabling Checklist

Before enabling ANY channel, complete this checklist:

### Legal & Compliance
- [ ] Channel terms of service reviewed with legal counsel
- [ ] Political messaging confirmed as allowed
- [ ] Consent language approved by legal counsel
- [ ] Privacy policy updated for channel
- [ ] Opt-out mechanisms reviewed
- [ ] Record retention policy documented

### Technical Setup
- [ ] Provider account configured
- [ ] API credentials secured in environment variables
- [ ] Webhooks configured and tested
- [ ] DNS records verified (email only)
- [ ] Sender authentication configured
- [ ] Test sends successful to admin-only addresses

### Content & Messaging
- [ ] Message templates created for channel
- [ ] Disclosure text reviewed and approved
- [ ] Localized content prepared (ht, fr, en)
- [ ] Character limits respected (SMS: 160/70, Web Push: 120)
- [ ] Quiet hours configured
- [ ] Frequency caps set

### Monitoring
- [ ] Bounce and complaint handlers configured
- [ ] Alerts set up for high bounce/complaint rates
- [ ] Delivery status tracking verified
- [ ] Cost monitoring enabled (SMS)
- [ ] Dashboard access granted to ops team

### Training
- [ ] Ops team trained on sending workflow
- [ ] Incident response procedures reviewed
- [ ] Escalation contacts documented
- [ ] Runbook reviewed with team

---

## Sending a Message

### Workflow Overview

```
DRAFT → IN_REVIEW → APPROVED → SCHEDULED → SENDING → SENT
```

### Step-by-Step Process

#### 1. Compose Message (`/admin/messages/new`)

**Required Fields**:
- Internal name (admin-facing)
- Topic (NEWS, EVENTS, FUNDRAISING, VOLUNTEER)
- Target channels (EMAIL, SMS, TELEGRAM, WEB_PUSH, WhatsApp)

**Per-Channel Variants** (create for each locale: ht, fr, en):

**Email**:
- Subject line (max 80 chars recommended)
- Preheader text (max 120 chars)
- Body HTML (rich text editor)
- Body plain text (auto-generated or custom)

**SMS**:
- Body text (watch segment counter!)
- GSM-7: 160 chars (single), 153 chars per segment (multi-part)
- Unicode: 70 chars (single), 67 chars per segment (multi-part)
- French/Creole accents (è, ò, à) trigger Unicode mode

**Telegram**:
- Body text (max 4096 chars)
- Optional media link

**Web Push**:
- Title (max 50 chars recommended)
- Body (max 120 chars recommended)
- Icon URL (optional)
- Click action URL

**WhatsApp Channel** (if enabled):
- Post text (max 4096 chars recommended)
- Media files (upload and pre-size)

**Automatic Appends** (cannot be removed):
- Sender identification ("Diaspora4Bellefleur")
- Affiliation disclosure (from candidate config)
- Unsubscribe footer with links

#### 2. Build Audience

**Segment Builder**:
- **Required**: Channel and topic consent (automatically enforced)
- **Optional Filters**:
  - Locales (ht, fr, en)
  - Countries (HT, US, CA, FR, etc.)
  - Chapters (if applicable)
  - Communes of origin
  - Engagement window (last active date)

**Automatic Exclusions** (always applied):
- Global suppression list
- Channel-specific suppression
- Unsubscribed contacts
- Bounced contacts
- Contacts who complained
- Frequency cap exceeded (default: 7 messages per week)

**Preview Count**:
- Click "Preview Audience" to see estimated recipients
- Audience is **snapshotted at send time** (not at preview time)

#### 3. Content Checks

**Automated Checks**:
- Factual claims about candidate → must have source references
- Fundraising asks → launch gate must be DONATIONS_LIVE
- Fundraising asks → pre-campaign rule respected (if configured)
- Required disclosures present
- All locales have content

**Manual Review**:
- Read message in all locales
- Check links work
- Verify images load
- Proofread for typos

#### 4. Submit for Review

- Click "Submit for Approval"
- Status changes to IN_REVIEW
- **Two-person rule**: Approver must differ from author
- **Large audience rule**: Audiences over 10,000 require second approver

#### 5. Approval

**Approver Checklist**:
- [ ] Content is accurate and sourced
- [ ] Tone is appropriate
- [ ] No typos or formatting issues
- [ ] Links work in all locales
- [ ] Audience targeting is correct
- [ ] Topic matches content
- [ ] Affiliation disclosure is visible
- [ ] No placeholder text

**Approve**:
- Click "Approve"
- Enter approval note
- Status changes to APPROVED

**Request Changes**:
- Click "Request Changes"
- Leave comment for author
- Status returns to DRAFT

#### 6. Schedule

- Set send date and time
- Time-zone note: Scheduling is in **system timezone** (server time)
- Quiet hours are enforced per-recipient timezone
- Recipients in quiet hours will be deferred to next available time

#### 7. Test Send (Optional but Recommended)

- Before scheduling, send to admin-only addresses
- Click "Send Test"
- Enter admin email/phone numbers (comma-separated)
- Review formatting and links
- Verify disclosure text appears

#### 8. Monitor Sending

- Status changes to SENDING when job starts
- Progress visible in `/admin/messages/[id]/delivery`
- Real-time stats:
  - Queued
  - Sent
  - Delivered
  - Bounced
  - Failed
  - Skipped (suppressed, quiet hours, no consent)

#### 9. Review Results

After send completes:
- **Delivery rate**: Sent / (Sent + Failed)
- **Bounce rate**: Bounced / Sent
- **Complaint rate**: Complained / Sent
- **Open rate**: Opened / Delivered (if tracking enabled)
- **Click rate**: Clicked / Opened (if tracking enabled)

**Alert Thresholds**:
- **Bounce rate > 5%**: Investigate immediately, channel may auto-pause
- **Complaint rate > 0.1%**: Critical issue, channel may auto-pause
- **Delivery rate < 90%**: Check provider status

---

## WhatsApp Channel Manual Publish

### Process Overview

WhatsApp Channel posts are **NEVER automated**. This is a manual process that respects Meta's policies and WhatsApp Terms of Service.

### Step-by-Step Instructions

#### 1. Create Message with WhatsApp Variant

- In message composer, enable "WhatsApp Channel" toggle
- Enter post text for each locale (ht, fr, en)
- Upload media (images/videos) if desired
- Media will be downloaded by assigned team member

#### 2. Approve Message

- Follow normal approval workflow
- Approval creates WhatsApp publish task

#### 3. Receive Task Assignment

**Assigned team member receives**:
- Email notification at scheduled time
- Task details in `/admin/whatsapp-tasks`
- Ready-to-paste text
- Links to download media (pre-sized for WhatsApp)

#### 4. Post to WhatsApp Channel (Manual Steps)

**On Your Phone**:

1. **Open WhatsApp** on your mobile device
   
2. **Navigate to your Channel**:
   - Swipe to "Updates" tab
   - Tap your Channel name

3. **Create new post**:
   - Tap the "+" button at bottom

4. **Copy text from task**:
   - Open task page on phone browser or copy from email
   - Long-press to copy text
   - Paste into WhatsApp post field

5. **Add media** (if applicable):
   - Tap attachment icon
   - Download media from task links
   - Select from phone gallery
   - Ensure correct orientation and sizing

6. **Review post**:
   - Check text is complete
   - Verify disclosure text is present
   - Check media displays correctly

7. **Publish**:
   - Tap "Send" button
   - Post goes live immediately

8. **Copy post link**:
   - Tap on the post you just created
   - Tap share icon
   - Select "Copy Link"

#### 5. Mark Task Complete

**Back on Admin Dashboard**:

1. Go to `/admin/whatsapp-tasks`
2. Find your task
3. Click "Mark as Posted"
4. Paste WhatsApp post link
5. Enter publish time (should auto-fill with current time)
6. Click "Save"

**Task status changes to POSTED** and is recorded in audit log.

### Important Notes

**DO**:
- ✅ Use official WhatsApp mobile app only
- ✅ Post manually, one at a time
- ✅ Copy text exactly as provided (includes required disclosures)
- ✅ Download and attach media from provided links
- ✅ Mark tasks as posted immediately after publishing
- ✅ Save post link for audit trail

**DO NOT**:
- ❌ Use WhatsApp Business Platform or Cloud API
- ❌ Use any automation tools or scripts
- ❌ Use unofficial WhatsApp apps or mods
- ❌ Remove or edit disclosure text
- ❌ Post from desktop (requires QR pairing which may violate TOS)
- ❌ Batch-post multiple messages at once using third-party tools

### Troubleshooting

**"I can't find my Channel"**:
- Swipe to Updates tab
- Scroll to find your Channel
- If not visible, you may not be admin - contact tech support

**"Media won't upload"**:
- Check file size (images: max 5MB, videos: max 16MB)
- Verify file format (JPEG/PNG for images, MP4 for videos)
- Re-download from task links
- Try on Wi-Fi instead of cellular

**"Text is too long"**:
- WhatsApp Channel limit: 4096 characters
- If text is too long, contact campaign ops to edit
- Do NOT manually shorten or truncate

**"I accidentally posted"**:
- Delete the post in WhatsApp
- Do NOT mark task as posted
- Contact campaign ops immediately
- Explain what happened

**"I marked wrong task as posted"**:
- Contact tech support immediately with correct post link
- They can update the audit record

### Media Requirements

**Images**:
- **Formats**: JPEG, PNG
- **Max size**: 5MB
- **Recommended dimensions**:
  - Square: 1080x1080
  - Landscape: 1920x1080
  - Portrait: 1080x1920
- **Note**: WhatsApp will auto-crop if not these exact dimensions

**Videos**:
- **Format**: MP4
- **Max size**: 16MB
- **Max duration**: 30 seconds
- **Recommended**: 1080x1080, H.264 codec, 30fps

**Pre-sizing**:
All media provided in tasks is already sized correctly. If you need to resize manually, use these tools:
- Desktop: Canva, Photoshop, FFMPEG
- Mobile: Built-in photo editor, Video Compressor app

---

## Incident Response

### High Bounce Rate (> 5%)

**Symptoms**:
- Alert: "BOUNCE_RATE_SPIKE" created
- Channel auto-paused
- Email delivery failures

**Immediate Actions**:
1. **Stop sending** (channel should auto-pause):
   ```bash
   # Verify pause status
   curl https://your-domain.com/api/admin/channels/EMAIL/status
   ```

2. **Investigate cause**:
   - Check provider dashboard for errors
   - Review recent email content for spam triggers
   - Check DNS records (SPF, DKIM, DMARC)
   - Look for invalid email addresses in audience

3. **Common causes**:
   - **List quality issue**: Old or purchased email list (NOT ALLOWED)
   - **DNS misconfiguration**: DKIM/SPF records expired or incorrect
   - **Content flags**: Spam filter triggers (too many links, all caps, etc.)
   - **Provider issue**: Email provider having delivery problems

4. **Resolution**:
   - Fix root cause (clean list, fix DNS, adjust content)
   - Clean suppression list of hard bounces
   - Send test message to admin
   - If successful, resume channel:
     ```bash
     # Via admin UI: /admin/channels/EMAIL
     # Or API:
     POST /api/admin/channels/EMAIL/resume
     {
       "resumedBy": "admin@example.com",
       "reason": "DNS records fixed, test successful"
     }
     ```

### High Complaint Rate (> 0.1%)

**Symptoms**:
- Alert: "COMPLAINT_RATE_SPIKE" created
- Channel auto-paused
- Spam complaints from recipients

**Immediate Actions**:
1. **STOP ALL SENDING IMMEDIATELY**:
   - Channel should auto-pause
   - Activate global kill switch if complaints continue:
     ```bash
     POST /api/admin/launch/kill-switch
     {
       "reason": "High complaint rate, investigating",
       "activatedBy": "admin@example.com"
     }
     ```

2. **Investigate complaints**:
   - Review complaint feedback from provider
   - Check if complaints are from specific segment
   - Review message content for issues
   - Verify consent records for complainants

3. **Common causes**:
   - **Consent issue**: Recipients don't remember signing up
   - **Frequency issue**: Too many messages too quickly
   - **Content issue**: Irrelevant or misleading content
   - **Unsubscribe issue**: Unsubscribe link not working

4. **Resolution**:
   - Fix consent flow (clearer language, double opt-in)
   - Reduce sending frequency
   - Improve content relevance and targeting
   - Test unsubscribe links in all messages
   - Wait 48 hours before resuming
   - Resume with small test audience first

5. **Long-term prevention**:
   - Review consent process
   - Add preference center link
   - Implement frequency cap (default: 7/week)
   - Segment audience more carefully

### Provider Account Suspended

**Symptoms**:
- All sends failing
- Provider dashboard shows "Account Suspended"
- Email from provider about violation

**Immediate Actions**:
1. **Activate kill switch**:
   ```bash
   POST /api/admin/launch/kill-switch
   {
       "reason": "Provider account suspended",
       "activatedBy": "admin@example.com"
   }
   ```

2. **Contact provider immediately**:
   - Open support ticket
   - Provide explanation of political use case
   - Show consent records
   - Show compliance measures

3. **Review violation**:
   - What rule was violated?
   - Was it a misunderstanding?
   - Do we need to change practices?

4. **Prepare backup provider**:
   - If suspension is permanent, switch to backup
   - Update DNS records
   - Test new provider
   - Resume sending

### Cost Spike (SMS)

**Symptoms**:
- Alert: "COST_SPIKE" created
- SMS costs exceed budget

**Immediate Actions**:
1. **Check usage**:
   ```bash
   # Via admin UI: /admin/channels/SMS/stats
   # Check: segment count, total sends, cost per send
   ```

2. **Common causes**:
   - **Unicode mode**: French/Creole accents triggering shorter segments
   - **Long messages**: Messages split into multiple segments
   - **High volume**: More sends than expected

3. **Resolution**:
   - Shorten SMS messages (aim for single segment)
   - Remove accents if possible (but maintain meaning)
   - Pause SMS channel if over budget
   - Switch to email for long-form content

4. **Prevention**:
   - Review all SMS templates for segment count
   - Set cost alarms at 80% of budget
   - Use segment calculator in composer
   - Test messages with French/Creole text before sending

### Quiet Hours Not Respected

**Symptoms**:
- Reports of messages received at night
- Messages sent outside 8am-8pm recipient local time

**Investigation**:
1. **Check recipient timezone**:
   - Timezone derived from country or stored timezone
   - Verify country data is correct

2. **Check daylight saving time**:
   - DST transitions can cause off-by-one errors
   - Verify timezone database is up to date

3. **Check configuration**:
   ```bash
   # SMS quiet hours: 9pm-8am
   # Email: No quiet hours (people read email on their schedule)
   ```

**Resolution**:
- Update timezone mapping if incorrect
- Defer affected contacts to next available time
- Apologize to affected recipients

### Global Kill Switch Activated

**When to activate**:
- Critical compliance issue discovered
- Provider account suspended
- High complaint rate (> 0.1%)
- Legal issue arises
- Security breach suspected

**How to activate**:
```bash
POST /api/admin/launch/kill-switch
{
  "reason": "Brief description of issue",
  "activatedBy": "admin@example.com"
}
```

**What happens**:
- All messaging immediately stops
- All pending jobs cancelled
- In-flight messages complete but no new messages sent
- Admin dashboard shows red banner
- All team members notified

**How to deactivate**:
```bash
POST /api/admin/launch/kill-switch/deactivate
{
  "deactivatedBy": "admin@example.com",
  "reason": "Issue resolved, tests passed"
}
```

**Post-incident**:
- Document incident in runbook
- Update procedures to prevent recurrence
- Review with team in retrospective

---

## Monitoring

### Key Metrics

**Delivery Health** (check daily):
- Delivery rate: > 95% (email), > 98% (SMS)
- Bounce rate: < 2% (email), < 1% (SMS)
- Complaint rate: < 0.05%
- Open rate: 15-30% (email, if tracking enabled)
- Click rate: 2-5% (email, if tracking enabled)

**Volume** (check weekly):
- Total sends per channel
- Sends per topic
- Growth rate

**Costs** (check weekly):
- SMS cost per message
- SMS cost per segment
- Total weekly cost
- Budget remaining

**Consent** (check monthly):
- New signups per channel
- Unsubscribes per channel
- Net consent growth
- Double opt-in completion rate

### Dashboards

**Admin Dashboard** (`/admin/dashboard`):
- Real-time delivery stats
- Recent alerts
- Channel health status
- Safety controls status (kill switch, channel pauses)

**Channel Dashboard** (`/admin/channels`):
- Per-channel delivery rates
- Per-channel bounce/complaint rates
- Channel configuration status
- Last send timestamp

**Message Dashboard** (`/admin/messages`):
- Recent messages
- Scheduled messages
- Delivery progress for active sends
- Historical performance

### Alerts

**Critical** (immediate response required):
- Global kill switch activated
- Channel auto-paused
- Complaint rate > 0.1%
- Bounce rate > 5%
- Provider API errors
- Cost exceeds budget by 50%

**Warning** (response within 4 hours):
- Delivery rate < 90%
- Bounce rate > 2%
- Complaint rate > 0.05%
- Cost at 80% of budget
- Frequency cap reached for many contacts

**Info** (response within 24 hours):
- New consent signup
- Channel test successful
- Message send completed
- Scheduled message upcoming

### Alert Channels

**Email**:
- Critical alerts to: ops-team@example.com
- Warning alerts to: ops-team@example.com
- Info alerts: No email (dashboard only)

**Slack** (future):
- #ops-alerts channel for all alerts
- @channel mention for critical

**PagerDuty** (future):
- On-call rotation for critical alerts

---

## Common Issues

### "Test message not received"

**Checklist**:
- [ ] Check spam folder
- [ ] Verify email address/phone number is correct
- [ ] Check provider dashboard for delivery status
- [ ] Verify DNS records (email only)
- [ ] Check channel is enabled
- [ ] Check kill switch is OFF

### "Segment count higher than expected"

**Cause**: French/Creole accents trigger Unicode mode

**Fix**:
- Remove non-essential accents (è → e, ò → o)
- Keep accents where meaning changes
- Use segment calculator before sending
- Consider switching to email for accented content

### "Audience smaller than expected"

**Common reasons**:
- Suppression list (bounces, complaints, unsubscribes)
- No consent for channel/topic combination
- Frequency cap reached (7 messages per week default)
- Country not in allow-list
- In quiet hours (deferred, not excluded)

**Investigation**:
- Check segment preview with filters applied
- Review suppression list
- Check consent records for sample contacts

### "Message stuck in SENDING"

**Cause**: Delivery job crashed or timed out

**Fix**:
1. Check job status: `/admin/messages/[id]/delivery`
2. Check error logs
3. Resume job if retryable:
   ```bash
   POST /api/admin/delivery/[jobId]/resume
   ```
4. If job is corrupt, cancel and restart:
   ```bash
   POST /api/admin/delivery/[jobId]/cancel
   # Then create new send job
   ```

### "Can't approve message"

**Common reasons**:
- Approver is same as author (two-person rule)
- Content checks failed (missing source, fundraising gate closed)
- Required fields missing
- Large audience requires second approver

**Fix**:
- Have different person approve
- Fix content check issues
- Complete all required fields
- Get second approval for large audiences

### "WhatsApp task not showing"

**Cause**: Message not approved yet, or WhatsApp variant not created

**Fix**:
1. Check message status - must be APPROVED
2. Check message has WhatsApp Channel variant
3. Check team member assignment
4. Refresh task list

---

## Environment Banners

### Staging Environment

**Red banner displayed on all pages**:
```
⚠️ STAGING ENVIRONMENT - NO REAL MESSAGES SENT ⚠️
```

**Enforcement**:
- All email addresses prefixed with `test+`
- All phone numbers use test provider sandbox
- No messages sent to real recipients
- Delivery stats are simulated

### Production Environment

**No banner** (clean interface)

**Verification**:
- Check `VERCEL_ENV` or `NODE_ENV`
- Staging: Show banner
- Production: No banner
- Development: Show banner

---

## Unverified Features

The following features are **designed and documented** but **cannot be verified** without a running production environment and real traffic:

### Cannot Verify Without Running App
1. **Email provider integration** - Mock implementation only
2. **SMS provider integration** - Stub only (Twilio API calls not implemented)
3. **Webhook handling** - Endpoints exist but not tested with real provider webhooks
4. **Bounce/complaint auto-suppression** - Logic exists but not verified with real events
5. **Quiet hours enforcement** - Timezone calculations tested but not under real sending
6. **Frequency cap enforcement** - Database queries exist but not load-tested
7. **Cross-channel deduplication** - Logic exists but not verified at scale
8. **Auto-pause on high bounce rate** - Threshold checks exist but not triggered in testing
9. **Kill switch immediate stop** - Cannot verify in-flight message behavior
10. **Staging environment banner** - Cannot verify without deploying to staging

### Cannot Verify Without Tests Passing
1. **Segment logic correctness** - Unit tests needed
2. **Suppression precedence** - Integration tests needed
3. **GSM-7 vs Unicode detection** - Test cases exist but not run
4. **Two-person approval enforcement** - E2E test needed
5. **Idempotent retries after crash** - Fault injection test needed
6. **STOP/HELP keyword handling** - SMS simulator needed
7. **Load test (100k emails)** - Performance test environment needed

### Cannot Verify Without External Dependencies
1. **Provider delivery times** - Depends on Twilio/Resend SLA
2. **DNS propagation** - Depends on DNS provider
3. **Daylight saving transitions** - Requires waiting for actual DST change
4. **Multi-day frequency cap** - Requires 7 days of sending
5. **Long-term bounce patterns** - Requires weeks of data

### Verification Plan

**Phase 1** (Before INFO_ONLY Launch):
- [x] Database schema complete
- [x] All models defined
- [ ] TypeScript compilation passes
- [ ] Unit tests pass
- [ ] Email mock adapter works

**Phase 2** (Before WAITLIST Launch):
- [ ] Real email provider integrated (Resend)
- [ ] Double opt-in flow tested with real emails
- [ ] Webhook handlers tested with provider test events
- [ ] Bounce/complaint handling verified

**Phase 3** (Before DONATIONS Launch):
- [ ] SMS provider integrated (Twilio)
- [ ] SMS keywords tested with real phone
- [ ] Quiet hours verified across timezones
- [ ] Frequency caps tested with real contacts
- [ ] Load test completed (10k+ messages)
- [ ] Auto-pause thresholds verified
- [ ] Kill switch tested in staging

**Phase 4** (Post-Launch):
- [ ] Monitor first 7 days of real sending
- [ ] Verify all safety controls work under production load
- [ ] Document actual bounce/complaint rates
- [ ] Tune thresholds based on real data

---

## Summary

This runbook covers:
- ✅ Channel setup steps (Email, SMS, WhatsApp, Telegram, Web Push)
- ✅ Enabling checklist (legal, technical, content, monitoring, training)
- ✅ Message sending workflow (draft → approve → send)
- ✅ WhatsApp Channel manual publish instructions (step-by-step, no automation)
- ✅ Incident response (high bounce rate, high complaint rate, account suspension, cost spike, kill switch)
- ✅ Monitoring dashboards and alerts
- ✅ Common issues and troubleshooting

**What cannot be verified**: See "Unverified Features" section above for 20+ items requiring production environment or passing tests.

---

**Next Steps**:
1. Complete Prompt A implementation (admin UI, double opt-in, email provider)
2. Fix audit blockers (TypeScript errors, missing dependencies)
3. Deploy to staging and verify environment banner
4. Run all tests and document results
5. Complete Phase 1-3 verification before launch

**Document Version**: 1.0  
**Last Updated**: November 18, 2026  
**Next Review**: After first production deployment
