---
name: "Messaging & Communications"
description: "Rules for all supporter communications, consent management, and channel usage"
inclusion: auto
---

# Messaging & Communications Rules

## Core Principles

All messaging features, integrations, and communications MUST follow these rules. These are non-negotiable and apply to every implementation task.

---

## Rule 1: WhatsApp Business Platform Prohibition

**NEVER** use any of the following for WhatsApp:

### Prohibited Technologies
- ❌ WhatsApp Business Platform or Cloud API
- ❌ WhatsApp solution providers (Twilio, MessageBird, Vonage, etc.)
- ❌ Unofficial WhatsApp libraries:
  - WAHA (WhatsApp HTTP API)
  - Whapi
  - Baileys
  - whatsapp-web.js
  - Any QR-pairing automation
  - Any phone number automation
- ❌ Any automated WhatsApp account
- ❌ Any WhatsApp message sending automation

### Why This Prohibition Exists

**Meta's WhatsApp Business Messaging Policy** (updated September 23, 2026) explicitly prohibits:
- Political parties
- Political candidates
- Political campaigns
- Entities offering political campaign services

From using the WhatsApp Business Platform.

Additionally, automation by political actors violates WhatsApp Terms of Service and can result in:
- Permanent account bans
- Phone number blacklisting
- Legal action
- Reputational damage

### What IS Allowed

✅ **Manual WhatsApp Channel posts** by team members  
✅ **"Follow on WhatsApp" links** to the official Channel (user's own action)  
✅ **"Share on WhatsApp" buttons** using wa.me prefilled messages (person-to-person)  
✅ **QR codes** linking to the WhatsApp Channel

All of these are user-initiated actions where the supporter uses their own WhatsApp account.

### Enforcement

A **CI check MUST fail the build** if the repository contains:
- Package names: `@whiskeysockets/baileys`, `whatsapp-web.js`, `waha`, `whapi`, `wa-automate`
- WhatsApp Graph API message endpoints: `/v*/messages`, `/v*/media`
- Solution provider SDKs configured for WhatsApp: `twilio.messages.create` with WhatsApp URNs
- QR code automation libraries combined with WhatsApp

---

## Rule 2: Never Misrepresent Political Purpose

When working with ANY messaging provider (email, SMS, push notification, etc.):

- ✅ **Always** disclose that this is a political support organization
- ✅ **Always** be transparent about the purpose (fundraising, advocacy, updates)
- ✅ **Never** classify as "non-political" to get approved
- ✅ **Never** hide or minimize the political nature

### Examples

**Good** (application to SMS provider):
> "We are an independent supporter organization for a political candidate in Haiti. We will send fundraising requests, campaign updates, and event invitations to supporters who have explicitly opted in."

**Bad** (lying to get approved):
> "We are a community news organization providing educational content."

### Why This Matters

- Many providers have specific political messaging policies
- Misrepresentation can lead to account termination
- Legal liability for fraud
- Violates project integrity principles

---

## Rule 3: Consent Requirements

### Per-Channel and Per-Topic

Consent MUST be:
- ✅ **Separate for each channel** (Email, SMS, Telegram, Web Push)
- ✅ **Separate for each topic** (News, Events, Fundraising, Volunteer)
- ✅ **Explicitly granted** (unticked checkboxes by default)
- ✅ **Provably stored** with timestamp, IP country, consent text version
- ✅ **Documented** in audit log

Consent MUST NEVER be:
- ❌ Bundled ("sign up for all updates")
- ❌ Pre-ticked checkboxes
- ❌ Purchased from third parties
- ❌ Scraped from public sources
- ❌ Assumed or inferred

### Double Opt-In Required

**Email consent** requires:
1. User submits form
2. Email sent with confirmation link
3. User clicks link
4. Status changes from PENDING → ACTIVE

**SMS consent** requires:
1. User submits form with phone number
2. SMS sent with one-time verification code
3. User enters code
4. Status changes from PENDING → ACTIVE

**Telegram/Web Push** require explicit user action (start bot, grant browser permission).

### Consent Records Must Include

- Channel (EMAIL, SMS, TELEGRAM, WEB_PUSH)
- Topic (NEWS, EVENTS, FUNDRAISING, VOLUNTEER)
- Language (ht, fr, en)
- Consent text version (exact wording shown)
- Consent timestamp (when granted)
- Source (which form/page)
- IP country (for compliance verification)
- Double opt-in confirmed timestamp
- Status (ACTIVE, PENDING, UNSUBSCRIBED, BOUNCED, COMPLAINED, SUPPRESSED)

---

## Rule 4: Every Message Must Include

### Required Elements

1. **Sender identification**
   - "From: [Organization Name]"
   - Email: clear From name and address
   - SMS: registered sender ID or short code

2. **Affiliation disclosure**
   - Must match the site's disclosure (independent/authorized/coordinated)
   - Email: in footer
   - SMS: abbreviated in initial message or first message to each recipient

3. **Working opt-out**
   - Email: One-click List-Unsubscribe header + footer link
   - SMS: STOP keyword
   - Telegram: /stop command or inline button
   - Web Push: browser settings link + preference center link

### Examples

**Email footer**:
```
Sent by [Organization Name]
Independent supporter initiative, not authorized by or affiliated with the candidate or campaign.

Update your preferences: [link]
Unsubscribe from all emails: [link]

[Physical mailing address]
```

**SMS**:
```
[Organization Name]: [message content]

This is an independent supporter initiative. Reply STOP to opt out, HELP for help. Msg&data rates may apply.
```

---

## Rule 5: Collect Minimum Data, Respect Channel Choice

### Minimum Data Collection

Only collect what's needed for the chosen channel:
- Email consent → only email address
- SMS consent → only phone number (with country)
- Both → only what user provides

Never:
- ❌ Require phone for email-only signup
- ❌ Require email for SMS-only signup
- ❌ Collect more than the minimum

### Channel Respect

- ✅ User opts in to Email → only send emails
- ✅ User opts in to SMS → only send SMS
- ✅ User opts in to both → can send to both
- ❌ **Never** use email to send SMS signup links uninvited
- ❌ **Never** use SMS to spam if they only gave email

### Data Security

- All names, emails, phone numbers use **field-level encryption**
- Blind indexes for search (never full-text search on PII)
- No message bodies stored for FUNDRAISING topic (sensitive)
- Audit log tracks who accessed what, when

---

## Channel-Specific Requirements

### Email (RFC 5322, CAN-SPAM, CASL, GDPR)

- SPF, DKIM, DMARC configured and verified
- RFC 8058 one-click List-Unsubscribe headers
- Both plain-text and HTML parts
- Physical mailing address in footer
- Separate sending subdomain (e.g., mail.diaspora4bellefleur.com)
- Bounce and complaint auto-suppression
- 30-day retention for operational logs, 7-year for audit logs

### SMS (TCPA, Cellular Telecommunications Industry Association Guidelines)

- Provider confirmation that political messaging is allowed
- Campaign Verify token or equivalent sender registration (where required)
- Sender type: Political (never misrepresent as Informational)
- Consent records exportable on demand
- Quiet hours: No messages 9pm-8am local time
- STOP and HELP keywords handled automatically
- Per-country allow-list (only send where legally permitted)
- Double opt-in with phone ownership verification

### Telegram (Bot API Terms)

- Official Bot API only (no MTProto)
- Users must /start the bot themselves
- No unsolicited messages
- Supports Channel posts (manual by team)

### Web Push (W3C Push API, VAPID)

- Standards-based Web Push only
- Explicit browser permission prompt
- Prompt ONLY after user action (never on page load)
- Service worker required
- VAPID keys for authentication

---

## Compliance Hooks

Every channel adapter MUST enforce:

1. **Country allow-list**: Never send to disallowed countries
2. **Legal basis reference**: Document why messaging is permitted (consent, legitimate interest)
3. **Quiet hours**: Respect time zones, no messages during sleep hours
4. **Sender identification**: Consistent sender name per locale
5. **Retention rules**: Operational data purged per policy, audit data retained
6. **Pre-campaign block**: If counsel requires, block FUNDRAISING topic until official campaign start date

---

## Suppression Rules

### Global Suppression

A contact on the **global suppression list** receives ZERO messages across ALL channels.

Reasons:
- User requested complete removal
- Legal hold (investigation, dispute)
- Fraud detection (suspected bad actor)

### Per-Channel Suppression

A contact suppressed for a **specific channel** receives no messages on that channel.

Reasons:
- Email: Hard bounce, spam complaint, unsubscribe
- SMS: STOP keyword, carrier block
- Telegram: Blocked the bot
- Web Push: Revoked browser permission

Suppression is **permanent by default** unless user explicitly re-subscribes.

---

## Admin Responsibilities

### Launch Control Checklist Items

Before enabling ANY channel:
- [ ] Provider terms reviewed, political messaging confirmed allowed
- [ ] Sender authentication configured (SPF/DKIM for email, sender ID for SMS)
- [ ] Test send to admin-only addresses successful
- [ ] Bounce and complaint handling configured
- [ ] Quiet hours and country restrictions set
- [ ] Consent export tested
- [ ] Audit log verified
- [ ] Legal counsel approved messaging plan

### Ongoing Monitoring

- Review bounce and complaint rates weekly
- Export consent proofs monthly for compliance
- Audit message logs quarterly
- Verify no unauthorized API usage (CI check)
- Update consent text versions as needed

---

## Testing Requirements

Every messaging feature MUST have tests proving:

1. ✅ No message sent without ACTIVE consent (channel + topic)
2. ✅ UNSUBSCRIBED contacts never selected
3. ✅ SUPPRESSED contacts never selected
4. ✅ Double opt-in required (email, SMS)
5. ✅ Preference center changes apply immediately
6. ✅ CI fails on forbidden WhatsApp packages/endpoints
7. ✅ Phone verification flow works
8. ✅ Consent text versioning tracked
9. ✅ PII never in logs (encrypted fields, blind indexes only)
10. ✅ Opt-out mechanisms work (STOP, unsubscribe links)

---

## Prohibited Practices (Summary)

Never:
- ❌ Use WhatsApp Business API or automation
- ❌ Misrepresent political purpose to providers
- ❌ Bundle consent across channels or topics
- ❌ Pre-tick consent checkboxes
- ❌ Purchase or scrape contact lists
- ❌ Send without explicit, provable consent
- ❌ Message a channel the person didn't choose
- ❌ Omit sender identification or disclosure
- ❌ Skip double opt-in
- ❌ Store unencrypted PII
- ❌ Log sensitive message contents
- ❌ Send during quiet hours
- ❌ Send to disallowed countries
- ❌ Ignore opt-out requests

---

## Enforcement

These rules are enforced through:

1. **CI checks** (fail build on violations)
2. **Database constraints** (cannot save invalid consent)
3. **Runtime validation** (cannot send without consent)
4. **Audit logging** (every action tracked)
5. **Code review** (steering file checked on every PR)
6. **Launch gate** (cannot enable channel without checklist)

Violations of these rules are **BLOCKER** issues that must be fixed before any deployment.

---

**Version**: 1.0  
**Last Updated**: November 18, 2026  
**Approved By**: [Legal Counsel] + [Compliance Lead]
