-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ElectoralOffice" AS ENUM ('SENATOR', 'DEPUTY', 'PRESIDENT', 'MAYOR', 'OTHER');

-- CreateEnum
CREATE TYPE "CandidacyStatus" AS ENUM ('UNVERIFIED', 'REGISTERED_PRELIMINARY', 'ON_FINAL_LIST', 'NOT_ON_FINAL_LIST');

-- CreateEnum
CREATE TYPE "AffiliationStatus" AS ENUM ('INDEPENDENT', 'AUTHORIZED', 'COORDINATED');

-- CreateEnum
CREATE TYPE "LaunchMode" AS ENUM ('INFO_ONLY', 'WAITLIST', 'DONATIONS_LIVE');

-- CreateEnum
CREATE TYPE "ChecklistCategory" AS ENUM ('LEGAL_HAITI', 'LEGAL_US', 'ENTITY_TAX', 'FINANCIAL', 'TECHNICAL', 'COMPLIANCE');

-- CreateEnum
CREATE TYPE "SubscriberStatus" AS ENUM ('PENDING', 'ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED');

-- CreateEnum
CREATE TYPE "NewsletterStatus" AS ENUM ('DRAFT', 'READY', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VolunteerSkill" AS ENUM ('TRANSLATION', 'DESIGN', 'SOCIAL_MEDIA', 'EVENTS', 'LEGAL', 'TECH', 'WRITING', 'OUTREACH', 'FUNDRAISING', 'DATA_ENTRY', 'OTHER');

-- CreateEnum
CREATE TYPE "VolunteerStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'COMPLETED', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EventLocationType" AS ENUM ('IN_PERSON', 'VIRTUAL', 'HYBRID');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'PAST');

-- CreateEnum
CREATE TYPE "RSVPStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'WAITLIST');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('PENDING', 'RESPONDED', 'ARCHIVED', 'SPAM');

-- CreateEnum
CREATE TYPE "ContentCategory" AS ENUM ('BIOGRAPHY', 'EDUCATION', 'PROFESSION', 'PUBLIC_SERVICE', 'PARTY_AFFILIATION', 'CEP_REGISTRATION', 'ELECTIONS', 'NEWS', 'TESTIMONIAL', 'FAQ_ANSWER', 'OTHER');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'NEEDS_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentConfidence" AS ENUM ('CONFIRMED', 'REPORTED_SINGLE_SOURCE', 'DISPUTED_DATE');

-- CreateEnum
CREATE TYPE "DatePrecision" AS ENUM ('EXACT', 'MONTH', 'YEAR', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "IntakeCategory" AS ENUM ('CEP_REGISTRATION', 'PARTY_2026', 'EDUCATION', 'WORK_HISTORY', 'PUBLIC_SERVICE', 'BIOGRAPHY', 'PHOTO', 'LOGO', 'NAME_PERMISSION', 'OTHER');

-- CreateEnum
CREATE TYPE "IntakeStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_MORE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'DISPUTED', 'UNDER_REVIEW', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('DONATION', 'PROCESSING_FEE', 'NET_DONATION', 'REFUND', 'CHARGEBACK', 'CHARGEBACK_REVERSAL', 'TRANSFER_OUT', 'TRANSFER_FEE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "LedgerAccount" AS ENUM ('GROSS_DONATIONS', 'PROCESSING_FEES', 'NET_DONATIONS', 'REFUNDS', 'CHARGEBACKS', 'TRANSFERS_OUT', 'TRANSFER_FEES', 'SUSPENSE');

-- CreateEnum
CREATE TYPE "CommunicationChannel" AS ENUM ('EMAIL', 'SMS', 'TELEGRAM', 'WEB_PUSH');

-- CreateEnum
CREATE TYPE "CommunicationTopic" AS ENUM ('NEWS', 'EVENTS', 'FUNDRAISING', 'VOLUNTEER');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('PENDING', 'ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED', 'SUPPRESSED');

-- CreateEnum
CREATE TYPE "SuppressionType" AS ENUM ('GLOBAL', 'CHANNEL_SPECIFIC');

-- CreateEnum
CREATE TYPE "ChannelHealthStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'DOWN', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "DeliveryJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WhatsAppTaskStatus" AS ENUM ('PENDING', 'REMINDED', 'POSTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MessageSendStatus" AS ENUM ('QUEUED', 'DEFERRED', 'SENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'COMPLAINED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('BOUNCE_RATE_SPIKE', 'COMPLAINT_RATE_SPIKE', 'COST_SPIKE', 'DELIVERY_FAILURE', 'CHANNEL_DOWN', 'FREQUENCY_CAP_EXCEEDED');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('DRAFT', 'PENDING_FIRST_APPROVAL', 'PENDING_SECOND_APPROVAL', 'APPROVED', 'EXECUTING', 'COMPLETED', 'FAILED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'COMPLETED_WITH_DISCREPANCIES', 'FAILED');

-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('AMOUNT_LIMIT', 'CUMULATIVE_CAP', 'COUNTRY_RESTRICTION', 'ELIGIBILITY_CHECK', 'FUNDRAISING_PERIOD', 'SANCTIONS_SCREENING', 'PROHIBITED_SOURCE', 'PRE_CAMPAIGN_BLOCK');

-- CreateEnum
CREATE TYPE "RuleVersionStatus" AS ENUM ('DRAFT', 'PENDING_FIRST_APPROVAL', 'PENDING_SECOND_APPROVAL', 'APPROVED', 'REJECTED', 'ACTIVE', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "ComplianceResult" AS ENUM ('ALLOW', 'REVIEW', 'DENY');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('NOT_APPLICABLE', 'PENDING', 'IN_REVIEW', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('APPROVE', 'DENY_PERMANENTLY', 'DENY_THIS_TIME', 'ESCALATE');

-- CreateEnum
CREATE TYPE "SanctionsStatus" AS ENUM ('CLEAR', 'POTENTIAL_MATCH', 'MATCH', 'ERROR', 'SKIPPED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'COMPLIANCE', 'VIEWER');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UpdateStatus" AS ENUM ('DRAFT', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NewsContentType" AS ENUM ('NEWS', 'INTERVIEW', 'OPINION_EDITORIAL', 'OFFICIAL_STATEMENT', 'VIDEO', 'OTHER');

-- CreateEnum
CREATE TYPE "NewsMatchTier" AS ENUM ('ABOUT', 'MENTION', 'UNRELATED');

-- CreateEnum
CREATE TYPE "NewsConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "NewsStatus" AS ENUM ('PENDING', 'NEEDS_REVIEW', 'PUBLISHED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "NewsHideReason" AS ENUM ('NOT_ABOUT_HIM', 'DUPLICATE', 'LINK_DEAD_OR_REMOVED', 'SPAM_OR_SCRAPER', 'PUBLISHER_TAKEDOWN_OR_LEGAL_REQUEST', 'ILLEGAL_OR_HATEFUL_CONTENT');

-- CreateEnum
CREATE TYPE "NewsSourceType" AS ENUM ('GDELT', 'RSS', 'LICENSED_API', 'MANUAL');

-- CreateEnum
CREATE TYPE "FraudEventType" AS ENUM ('RISK_SCORE_CALCULATED', 'VELOCITY_VIOLATION', 'BOT_DETECTED', 'ALERT_TRIGGERED', 'MANUAL_REVIEW_FLAGGED', 'SUSPICIOUS_PATTERN');

-- CreateEnum
CREATE TYPE "FraudSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ManualReviewStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'ESCALATED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ManualReviewDecision" AS ENUM ('APPROVE', 'DENY', 'REQUEST_MORE_INFO');

-- CreateEnum
CREATE TYPE "RefundSource" AS ENUM ('SELF_SERVICE', 'ADMIN', 'BULK_REFUND', 'CHARGEBACK');

-- CreateEnum
CREATE TYPE "RefundTicketStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BulkRefundStatus" AS ENUM ('DRAFT', 'PENDING_FIRST_APPROVAL', 'PENDING_SECOND_APPROVAL', 'APPROVED', 'EXECUTING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ChargebackStatus" AS ENUM ('NEEDS_RESPONSE', 'EVIDENCE_SUBMITTED', 'UNDER_REVIEW', 'WON', 'LOST', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "ConsentPurpose" AS ENUM ('EMAIL', 'WHATSAPP', 'PUBLIC_RECOGNITION', 'ESSENTIAL');

-- CreateEnum
CREATE TYPE "ConsentBasis" AS ENUM ('EXPLICIT_CONSENT', 'IMPLIED_CONSENT', 'LEGITIMATE_INTEREST', 'CONTRACT', 'LEGAL_OBLIGATION');

-- CreateEnum
CREATE TYPE "DataSubjectRequestType" AS ENUM ('ACCESS', 'ERASURE', 'RECTIFICATION', 'PORTABILITY', 'OBJECT', 'RESTRICT_PROCESSING');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'DENIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ChapterStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'LEFT', 'REMOVED');

-- CreateEnum
CREATE TYPE "SupporterPageStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'REMOVED');

-- CreateEnum
CREATE TYPE "SupporterPageReportReason" AS ENUM ('PROFANITY', 'IMPERSONATION', 'SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'OTHER');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('OWNER', 'COMPLIANCE', 'FINANCE', 'EDITOR', 'MODERATOR', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "DataSubjectRequestStatus" AS ENUM ('PENDING', 'VERIFYING', 'VERIFIED', 'IN_PROGRESS', 'COMPLETED', 'DENIED', 'CANCELLED', 'ON_LEGAL_HOLD');

-- CreateEnum
CREATE TYPE "BackgroundJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT');

-- CreateTable
CREATE TABLE "CandidateConfig" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "office" "ElectoralOffice" NOT NULL,
    "department" TEXT NOT NULL,
    "communes" TEXT[],
    "party" TEXT,
    "candidacyStatus" "CandidacyStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "candidacyStatusSource" TEXT,
    "candidacyStatusDate" TIMESTAMP(3),
    "candidacyStatusVerifier" TEXT,
    "candidacyEvidenceUrl" TEXT,
    "officialCampaignStart" TIMESTAMP(3),
    "firstRoundDate" TIMESTAMP(3),
    "firstRoundDateNote" TEXT,
    "secondRoundDate" TIMESTAMP(3),
    "secondRoundDateNote" TEXT,
    "minAmountCents" INTEGER NOT NULL,
    "maxAmountCents" INTEGER NOT NULL,
    "cumulativeCapCents" INTEGER NOT NULL,
    "fundraisingGoalCents" INTEGER,
    "domain" TEXT,
    "supportEmail" TEXT NOT NULL,
    "photoUrl" TEXT,
    "defaultLocale" TEXT NOT NULL DEFAULT 'ht',
    "affiliationStatus" "AffiliationStatus" NOT NULL DEFAULT 'INDEPENDENT',
    "affiliationText" TEXT NOT NULL DEFAULT 'independent supporter initiative, not authorized by or affiliated with the candidate, his campaign or any party',
    "affiliationAgreementRef" TEXT,
    "affiliationAgreementDate" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CandidateConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaunchGate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mode" "LaunchMode" NOT NULL DEFAULT 'INFO_ONLY',
    "modeChangedBy" TEXT,
    "modeChangedAt" TIMESTAMP(3),
    "modeChangeReason" TEXT,
    "killSwitchActive" BOOLEAN NOT NULL DEFAULT false,
    "killSwitchReason" TEXT,
    "killSwitchBy" TEXT,
    "killSwitchAt" TIMESTAMP(3),

    CONSTRAINT "LaunchGate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaunchChecklistItem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "itemKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ChecklistCategory" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "checkedBy" TEXT,
    "checkedAt" TIMESTAMP(3),
    "documentRef" TEXT,
    "documentUrl" TEXT,
    "notes" TEXT,

    CONSTRAINT "LaunchChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistSignup" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT,
    "country" TEXT NOT NULL,
    "communeOfOrigin" TEXT,
    "preferredLocale" TEXT NOT NULL DEFAULT 'en',
    "emailConsent" BOOLEAN NOT NULL DEFAULT false,
    "whatsappConsent" BOOLEAN NOT NULL DEFAULT false,
    "emailConsentedAt" TIMESTAMP(3),
    "whatsappConsentedAt" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "consentIpAddress" TEXT,
    "consentUserAgent" TEXT,
    "consentText" TEXT NOT NULL,
    "referralCode" TEXT,
    "source" TEXT,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "unsubscribed" BOOLEAN NOT NULL DEFAULT false,
    "unsubscribedAt" TIMESTAMP(3),

    CONSTRAINT "WaitlistSignup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "country" TEXT,
    "communeOfOrigin" TEXT,
    "chapterId" TEXT,
    "preferredLocale" TEXT NOT NULL DEFAULT 'en',
    "status" "SubscriberStatus" NOT NULL DEFAULT 'PENDING',
    "subscribedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationSentAt" TIMESTAMP(3),
    "consentIpAddress" TEXT,
    "consentUserAgent" TEXT,
    "consentText" TEXT NOT NULL,
    "lastEmailSentAt" TIMESTAMP(3),
    "lastOpenedAt" TIMESTAMP(3),
    "lastClickedAt" TIMESTAMP(3),
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "bounced" BOOLEAN NOT NULL DEFAULT false,
    "bouncedAt" TIMESTAMP(3),
    "bounceType" TEXT,
    "bounceReason" TEXT,
    "source" TEXT,
    "referralCode" TEXT,
    "tags" TEXT[],

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Newsletter" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "subjectHt" TEXT NOT NULL,
    "subjectFr" TEXT NOT NULL,
    "subjectEn" TEXT NOT NULL,
    "bodyHt" TEXT NOT NULL,
    "bodyFr" TEXT NOT NULL,
    "bodyEn" TEXT NOT NULL,
    "previewTextHt" TEXT,
    "previewTextFr" TEXT,
    "previewTextEn" TEXT,
    "senderName" TEXT NOT NULL DEFAULT 'Diaspora4Bellefleur',
    "senderEmail" TEXT NOT NULL,
    "replyTo" TEXT,
    "segmentCountries" TEXT[],
    "segmentCommunes" TEXT[],
    "segmentChapters" TEXT[],
    "segmentTags" TEXT[],
    "status" "NewsletterStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "openedCount" INTEGER NOT NULL DEFAULT 0,
    "clickedCount" INTEGER NOT NULL DEFAULT 0,
    "bouncedCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdByEmail" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedByEmail" TEXT,
    "approvedAt" TIMESTAMP(3),
    "testSentTo" TEXT[],
    "testSentAt" TIMESTAMP(3),

    CONSTRAINT "Newsletter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSend" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "newsletterId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "firstOpenedAt" TIMESTAMP(3),
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickedAt" TIMESTAMP(3),
    "firstClickedAt" TIMESTAMP(3),
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "bouncedAt" TIMESTAMP(3),
    "bounceType" TEXT,
    "providerMessageId" TEXT,

    CONSTRAINT "NewsletterSend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Volunteer" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "whatsapp" TEXT,
    "preferredLocale" TEXT NOT NULL DEFAULT 'en',
    "country" TEXT NOT NULL,
    "city" TEXT,
    "timeZone" TEXT,
    "skills" "VolunteerSkill"[],
    "skillsOther" TEXT,
    "hoursPerWeek" TEXT,
    "availability" TEXT,
    "interests" TEXT[],
    "status" "VolunteerStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "consentIpAddress" TEXT,
    "consentUserAgent" TEXT,
    "emailUpdates" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT,
    "referralCode" TEXT,
    "notes" TEXT,

    CONSTRAINT "Volunteer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerAssignment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skill" "VolunteerSkill",
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "VolunteerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "titleHt" TEXT NOT NULL,
    "titleFr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionHt" TEXT NOT NULL,
    "descriptionFr" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3),
    "timeZone" TEXT NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "locationType" "EventLocationType" NOT NULL,
    "locationName" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "virtualUrl" TEXT,
    "organizerName" TEXT NOT NULL,
    "organizerEmail" TEXT NOT NULL,
    "chapterId" TEXT,
    "rsvpEnabled" BOOLEAN NOT NULL DEFAULT true,
    "rsvpCapacity" INTEGER,
    "rsvpDeadline" TIMESTAMP(3),
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "rsvpCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRSVP" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "status" "RSVPStatus" NOT NULL DEFAULT 'PENDING',
    "guests" INTEGER NOT NULL DEFAULT 0,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" TIMESTAMP(3),
    "reminderSentAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "EventRSVP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "subject" TEXT,
    "question" TEXT NOT NULL,
    "status" "QuestionStatus" NOT NULL DEFAULT 'PENDING',
    "response" TEXT,
    "respondedBy" TEXT,
    "respondedAt" TIMESTAMP(3),
    "cannedReplyId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referralCode" TEXT,
    "spamScore" DOUBLE PRECISION,
    "markedAsSpam" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CannedReply" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "titleHt" TEXT NOT NULL,
    "titleFr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "contentHt" TEXT NOT NULL,
    "contentFr" TEXT NOT NULL,
    "contentEn" TEXT NOT NULL,
    "useCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CannedReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriberExport" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exportType" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "exportedBy" TEXT NOT NULL,
    "exportedByEmail" TEXT NOT NULL,
    "exportedByRole" TEXT NOT NULL,
    "ipAddress" TEXT,
    "fileUrl" TEXT,
    "reason" TEXT NOT NULL,

    CONSTRAINT "SubscriberExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "ContentCategory" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "textHt" TEXT,
    "textFr" TEXT,
    "textEn" TEXT,
    "date" TIMESTAMP(3),
    "datePrecision" "DatePrecision" NOT NULL DEFAULT 'EXACT',
    "quote" TEXT,
    "quoteSourced" BOOLEAN NOT NULL DEFAULT false,
    "quoteOriginalLanguage" TEXT,
    "confidence" "ContentConfidence" NOT NULL DEFAULT 'REPORTED_SINGLE_SOURCE',
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "verifiedBy" TEXT,
    "verificationDate" TIMESTAMP(3),
    "verificationNotes" TEXT,
    "author" TEXT,
    "tags" TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentSource" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "accessedOn" TIMESTAMP(3) NOT NULL,
    "fileUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ContentSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeSubmission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "category" "IntakeCategory" NOT NULL,
    "status" "IntakeStatus" NOT NULL DEFAULT 'PENDING',
    "priority" BOOLEAN NOT NULL DEFAULT false,
    "factTextHt" TEXT,
    "factTextFr" TEXT,
    "factTextEn" TEXT,
    "submittedBy" TEXT NOT NULL,
    "contactEmail" TEXT,
    "evidenceUrls" TEXT[],
    "evidenceNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "contentId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "IntakeSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeChecklist" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "itemKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "category" "IntakeCategory" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "submissionId" TEXT,
    "evidenceUrl" TEXT,
    "verificationNotes" TEXT,

    CONSTRAINT "IntakeChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "questionHt" TEXT NOT NULL,
    "questionFr" TEXT NOT NULL,
    "questionEn" TEXT NOT NULL,
    "answerHt" TEXT NOT NULL,
    "answerFr" TEXT NOT NULL,
    "answerEn" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQSource" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "faqId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "publisher" TEXT,
    "notes" TEXT,

    CONSTRAINT "FAQSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "donorId" TEXT,
    "donorEmail" TEXT NOT NULL,
    "donorFirstName" TEXT NOT NULL,
    "donorLastName" TEXT NOT NULL,
    "donorCountry" TEXT NOT NULL,
    "donorPostalCode" TEXT,
    "donorOptInPublic" BOOLEAN NOT NULL DEFAULT false,
    "donorOptInEmail" BOOLEAN NOT NULL DEFAULT false,
    "paymentProvider" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentCompletedAt" TIMESTAMP(3),
    "paymentFailedReason" TEXT,
    "complianceChecked" BOOLEAN NOT NULL DEFAULT false,
    "complianceFlags" TEXT[],
    "complianceNotes" TEXT,
    "receiptNumber" TEXT,
    "receiptSentAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "referralCode" TEXT,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentIntent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "provider" TEXT NOT NULL,
    "providerIntentId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "complianceCheckId" TEXT NOT NULL,
    "contributionId" TEXT,
    "paymentMethodType" TEXT,
    "cardLast4" TEXT,
    "cardBrand" TEXT,
    "cardExpMonth" INTEGER,
    "cardExpYear" INTEGER,
    "confirmedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "paymentIntentId" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "signatureValid" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB NOT NULL,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entryType" "LedgerEntryType" NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "donorEmail" TEXT NOT NULL,
    "debitCents" INTEGER NOT NULL DEFAULT 0,
    "creditCents" INTEGER NOT NULL DEFAULT 0,
    "account" "LedgerAccount" NOT NULL,
    "description" TEXT NOT NULL,
    "complianceCheckId" TEXT NOT NULL,
    "attestationVersion" JSONB,
    "rulesVersion" JSONB,
    "metadata" JSONB,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nameEncrypted" TEXT,
    "emailEncrypted" TEXT,
    "phoneEncrypted" TEXT,
    "emailBlindIndex" TEXT,
    "phoneBlindIndex" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "country" TEXT,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelConsent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contactId" TEXT NOT NULL,
    "channel" "CommunicationChannel" NOT NULL,
    "topic" "CommunicationTopic" NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'PENDING',
    "grantedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "consentTextVersionId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "verificationToken" TEXT,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "ChannelConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suppression" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contactId" TEXT NOT NULL,
    "suppressionType" "SuppressionType" NOT NULL,
    "channel" "CommunicationChannel",
    "reason" TEXT NOT NULL,
    "permanent" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Suppression_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contactId" TEXT NOT NULL,
    "channel" "CommunicationChannel" NOT NULL,
    "topic" "CommunicationTopic" NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "providerMessageId" TEXT,

    CONSTRAINT "MessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelConfig" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "channel" "CommunicationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" INTEGER,
    "quietHoursEnd" INTEGER,
    "allowedCountries" TEXT[],
    "maxPerDay" INTEGER,
    "maxPerHour" INTEGER,
    "checklistComplete" BOOLEAN NOT NULL DEFAULT false,
    "healthStatus" "ChannelHealthStatus" NOT NULL DEFAULT 'UNKNOWN',
    "lastHealthCheck" TIMESTAMP(3),
    "healthError" TEXT,

    CONSTRAINT "ChannelConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentTextVersion" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" TEXT NOT NULL,
    "textHt" TEXT NOT NULL,
    "textFr" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ConsentTextVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppConfig" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "channelUrl" TEXT,
    "guidelinesReviewed" BOOLEAN NOT NULL DEFAULT false,
    "guidelinesReviewedBy" TEXT,
    "guidelinesReviewedAt" TIMESTAMP(3),

    CONSTRAINT "WhatsAppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "internalName" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdByEmail" TEXT NOT NULL,
    "inReviewAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedByEmail" TEXT,
    "approvedAt" TIMESTAMP(3),
    "secondApprovedBy" TEXT,
    "secondApprovedByEmail" TEXT,
    "secondApprovedAt" TIMESTAMP(3),
    "requiresSecondApproval" BOOLEAN NOT NULL DEFAULT false,
    "scheduledFor" TIMESTAMP(3),
    "sendingStartedAt" TIMESTAMP(3),
    "sendingCompletedAt" TIMESTAMP(3),
    "audienceSnapshot" JSONB,
    "estimatedRecipients" INTEGER NOT NULL DEFAULT 0,
    "topic" "CommunicationTopic" NOT NULL,
    "hasFactualClaims" BOOLEAN NOT NULL DEFAULT false,
    "factualClaimsVerified" BOOLEAN NOT NULL DEFAULT false,
    "hasFundraisingAsk" BOOLEAN NOT NULL DEFAULT false,
    "fundraisingCheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalDelivered" INTEGER NOT NULL DEFAULT 0,
    "totalBounced" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "totalOpened" INTEGER NOT NULL DEFAULT 0,
    "totalClicked" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostCents" INTEGER,
    "actualCostCents" INTEGER,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageVariant" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "messageId" TEXT NOT NULL,
    "channel" "CommunicationChannel" NOT NULL,
    "locale" TEXT NOT NULL,
    "emailSubject" TEXT,
    "emailPreheader" TEXT,
    "emailBodyHtml" TEXT,
    "emailBodyText" TEXT,
    "smsBody" TEXT,
    "smsSegmentCount" INTEGER,
    "smsIsUnicode" BOOLEAN NOT NULL DEFAULT false,
    "smsEstimatedCostCents" INTEGER,
    "telegramBody" TEXT,
    "webPushTitle" TEXT,
    "webPushBody" TEXT,
    "webPushIcon" TEXT,
    "webPushUrl" TEXT,
    "whatsappChannelText" TEXT,
    "whatsappChannelMediaUrls" TEXT[],
    "templateVariables" JSONB,

    CONSTRAINT "MessageVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestSend" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageId" TEXT NOT NULL,
    "sentBy" TEXT NOT NULL,
    "sentByEmail" TEXT NOT NULL,
    "sentTo" TEXT NOT NULL,
    "channel" "CommunicationChannel" NOT NULL,
    "locale" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,

    CONSTRAINT "TestSend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryJob" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "messageId" TEXT NOT NULL,
    "channel" "CommunicationChannel" NOT NULL,
    "locale" TEXT NOT NULL,
    "recipientContactIds" TEXT[],
    "batchStartIndex" INTEGER NOT NULL DEFAULT 0,
    "batchSize" INTEGER NOT NULL DEFAULT 100,
    "status" "DeliveryJobStatus" NOT NULL DEFAULT 'PENDING',
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "nextBatchCursor" TEXT,

    CONSTRAINT "DeliveryJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageAudience" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageId" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "estimatedCount" INTEGER NOT NULL DEFAULT 0,
    "lastCountedAt" TIMESTAMP(3),

    CONSTRAINT "MessageAudience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppChannelTask" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "messageId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "assignedToEmail" TEXT NOT NULL,
    "status" "WhatsAppTaskStatus" NOT NULL DEFAULT 'PENDING',
    "textToPaste" TEXT NOT NULL,
    "mediaDownloadUrls" TEXT[],
    "reminderSentAt" TIMESTAMP(3),
    "markedPostedAt" TIMESTAMP(3),
    "markedPostedBy" TEXT,
    "postLink" TEXT,
    "postPublishedAt" TIMESTAMP(3),

    CONSTRAINT "WhatsAppChannelTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageSendRecord" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "messageId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "channel" "CommunicationChannel" NOT NULL,
    "locale" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "status" "MessageSendStatus" NOT NULL DEFAULT 'QUEUED',
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "complainedAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT NOT NULL,
    "deferredUntil" TIMESTAMP(3),

    CONSTRAINT "MessageSendRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrequencyCap" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contactId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "messagesSent" INTEGER NOT NULL DEFAULT 0,
    "maxMessages" INTEGER NOT NULL,

    CONSTRAINT "FrequencyCap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelPause" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" "CommunicationChannel" NOT NULL,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "pausedBy" TEXT,
    "pausedAt" TIMESTAMP(3),
    "pauseReason" TEXT,
    "autoPausedByBounceRate" BOOLEAN NOT NULL DEFAULT false,
    "autoPausedByComplaintRate" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ChannelPause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alertType" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "channel" "CommunicationChannel",
    "messageId" TEXT,
    "metric" TEXT,
    "currentValue" TEXT,
    "threshold" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "CommunicationChannel" NOT NULL,
    "topic" "CommunicationTopic" NOT NULL,
    "subjectHt" TEXT,
    "subjectFr" TEXT,
    "subjectEn" TEXT,
    "bodyHt" TEXT,
    "bodyFr" TEXT,
    "bodyEn" TEXT,
    "variables" TEXT[],
    "useCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipientConfig" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "legalName" TEXT NOT NULL,
    "taxId" TEXT,
    "country" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "accountReference" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdByEmail" TEXT NOT NULL,
    "previousConfigId" TEXT,

    CONSTRAINT "RecipientConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "recipientConfigId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'DRAFT',
    "requestedBy" TEXT NOT NULL,
    "requestedByEmail" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstApprovedBy" TEXT,
    "firstApprovedByEmail" TEXT,
    "firstApprovedAt" TIMESTAMP(3),
    "secondApprovedBy" TEXT,
    "secondApprovedByEmail" TEXT,
    "secondApprovedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedByEmail" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "executedAt" TIMESTAMP(3),
    "executedBy" TEXT,
    "providerTransferId" TEXT,
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "notes" TEXT,

    CONSTRAINT "TransferRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "ReconciliationStatus" NOT NULL,
    "ourRecordCount" INTEGER NOT NULL,
    "providerRecordCount" INTEGER NOT NULL,
    "matchedCount" INTEGER NOT NULL,
    "mismatchCount" INTEGER NOT NULL,
    "discrepancies" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "ReconciliationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRule" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ruleType" "RuleType" NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "legalBasisReference" TEXT,

    CONSTRAINT "ComplianceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRuleVersion" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ruleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ruleType" "RuleType" NOT NULL,
    "config" JSONB NOT NULL,
    "legalBasisReference" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL,
    "status" "RuleVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdByEmail" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedByEmail" TEXT,
    "approvedAt" TIMESTAMP(3),
    "secondApprovedBy" TEXT,
    "secondApprovedByEmail" TEXT,
    "secondApprovedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedByEmail" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "activatedAt" TIMESTAMP(3),
    "activatedBy" TEXT,

    CONSTRAINT "ComplianceRuleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EligibilityAttestation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "textHt" TEXT NOT NULL,
    "textFr" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "legalBasis" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdByEmail" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedByEmail" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "EligibilityAttestation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceCheck" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "donorEmail" TEXT NOT NULL,
    "donorEmailNormalized" TEXT NOT NULL,
    "donorFingerprint" TEXT,
    "donorIpAddress" TEXT,
    "donorCountry" TEXT,
    "declaredCountry" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethodType" TEXT,
    "paymentMethodFingerprint" TEXT,
    "cardBin" TEXT,
    "cardCountry" TEXT,
    "cardType" TEXT,
    "attestations" JSONB NOT NULL,
    "result" "ComplianceResult" NOT NULL,
    "reasons" TEXT[],
    "reasonDetails" JSONB NOT NULL,
    "rulesVersion" TEXT NOT NULL,
    "rulesApplied" JSONB NOT NULL,
    "donorHistoricalTotal" INTEGER NOT NULL DEFAULT 0,
    "donorNewTotal" INTEGER NOT NULL,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "assignedTo" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "reviewDecision" "ReviewDecision",
    "contributionId" TEXT,

    CONSTRAINT "ComplianceCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SanctionsScreening" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "donorName" TEXT NOT NULL,
    "donorEmail" TEXT NOT NULL,
    "donorCountry" TEXT,
    "ipAddress" TEXT,
    "provider" TEXT NOT NULL,
    "providerRequestId" TEXT,
    "status" "SanctionsStatus" NOT NULL,
    "matchScore" DOUBLE PRECISION,
    "matchDetails" JSONB,
    "complianceCheckId" TEXT,

    CONSTRAINT "SanctionsScreening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorBlocklist" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "fingerprint" TEXT,
    "reason" TEXT NOT NULL,
    "blockedBy" TEXT NOT NULL,
    "blockedByEmail" TEXT NOT NULL,
    "blockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewNotes" TEXT,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "DonorBlocklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "ipAddress" TEXT,
    "reason" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "passwordHash" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "titleHt" TEXT NOT NULL,
    "titleFr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "summaryHt" TEXT,
    "summaryFr" TEXT,
    "summaryEn" TEXT,
    "bodyHt" TEXT,
    "bodyFr" TEXT,
    "bodyEn" TEXT,
    "status" "IssueStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "isOfficialPosition" BOOLEAN NOT NULL DEFAULT false,
    "supporterSummary" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "versionHistory" JSONB[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "tags" TEXT[],

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueSource" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issueId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publisher" TEXT,
    "date" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "IssueSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Update" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "titleHt" TEXT NOT NULL,
    "titleFr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "bodyHt" TEXT NOT NULL,
    "bodyFr" TEXT NOT NULL,
    "bodyEn" TEXT NOT NULL,
    "status" "UpdateStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "tags" TEXT[],
    "imageUrl" TEXT,

    CONSTRAINT "Update_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PressKit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "contentHt" TEXT,
    "contentFr" TEXT,
    "contentEn" TEXT,
    "logoUrl" TEXT,
    "photoUrl" TEXT,
    "bioUrl" TEXT,
    "factSheetUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "PressKit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commune" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "arrondissement" TEXT NOT NULL,
    "population2015" INTEGER,
    "populationSource" TEXT,
    "populationSourceUrl" TEXT,
    "supporterCount" INTEGER NOT NULL DEFAULT 0,
    "descriptionHt" TEXT,
    "descriptionFr" TEXT,
    "descriptionEn" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Commune_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsArticle" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "url" TEXT NOT NULL,
    "originalUrl" TEXT,
    "headline" TEXT NOT NULL,
    "outlet" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "language" TEXT NOT NULL,
    "metaDescription" TEXT,
    "contentType" "NewsContentType" NOT NULL DEFAULT 'NEWS',
    "contentTypeOverride" BOOLEAN NOT NULL DEFAULT false,
    "matchScore" INTEGER NOT NULL DEFAULT 0,
    "matchTier" "NewsMatchTier" NOT NULL DEFAULT 'MENTION',
    "matchConfidence" "NewsConfidence" NOT NULL DEFAULT 'MEDIUM',
    "status" "NewsStatus" NOT NULL DEFAULT 'PENDING',
    "publishedToSiteAt" TIMESTAMP(3),
    "hiddenAt" TIMESTAMP(3),
    "hiddenBy" TEXT,
    "hideReason" "NewsHideReason",
    "hideReasonText" TEXT,
    "sourceId" TEXT,
    "discoveredVia" TEXT NOT NULL,
    "ingestionRunId" TEXT,
    "domain" TEXT NOT NULL,
    "isPaywalled" BOOLEAN NOT NULL DEFAULT false,
    "lastCheckedAt" TIMESTAMP(3),
    "linkStatus" INTEGER,

    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsSource" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" "NewsSourceType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "lastSuccessAt" TIMESTAMP(3),
    "lastErrorAt" TIMESTAMP(3),
    "lastErrorMessage" TEXT,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NewsSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsQuery" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "queryPattern" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "minScore" INTEGER NOT NULL DEFAULT 4,
    "autoPublishScore" INTEGER NOT NULL DEFAULT 7,
    "articlesFound" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "NewsQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceType" "NewsSourceType" NOT NULL,
    "sourceName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "articlesDiscovered" INTEGER NOT NULL DEFAULT 0,
    "articlesCreated" INTEGER NOT NULL DEFAULT 0,
    "articlesDuplicate" INTEGER NOT NULL DEFAULT 0,
    "articlesRejected" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessages" TEXT[],
    "durationMs" INTEGER,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" "FraudEventType" NOT NULL,
    "severity" "FraudSeverity" NOT NULL DEFAULT 'LOW',
    "ipAddress" TEXT,
    "email" TEXT,
    "dimension" TEXT,
    "identifier" TEXT,
    "contributionId" TEXT,
    "metadata" JSONB,
    "error" TEXT,

    CONSTRAINT "FraudEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualReviewItem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contributionId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "riskScore" INTEGER,
    "status" "ManualReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "decision" "ManualReviewDecision",
    "decisionNotes" TEXT,
    "requiresEscalation" BOOLEAN NOT NULL DEFAULT false,
    "escalatedTo" TEXT,
    "escalatedAt" TIMESTAMP(3),

    CONSTRAINT "ManualReviewItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contributionId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "verifyIp" TEXT,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contributionId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "receiptData" JSONB NOT NULL,
    "locale" TEXT NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundMagicLink" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contributionId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedIp" TEXT,

    CONSTRAINT "RefundMagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundTicket" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contributionId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requestorIp" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "reasonDetails" TEXT,
    "amountCents" INTEGER NOT NULL,
    "source" "RefundSource" NOT NULL DEFAULT 'SELF_SERVICE',
    "status" "RefundTicketStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "deniedBy" TEXT,
    "deniedAt" TIMESTAMP(3),
    "denyReason" TEXT,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "RefundTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkRefundRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "filters" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "preview" JSONB NOT NULL,
    "status" "BulkRefundStatus" NOT NULL DEFAULT 'DRAFT',
    "requestedBy" TEXT NOT NULL,
    "requestedByRole" TEXT NOT NULL,
    "firstApprovedBy" TEXT,
    "firstApprovedByRole" TEXT,
    "firstApprovedAt" TIMESTAMP(3),
    "secondApprovedBy" TEXT,
    "secondApprovedByRole" TEXT,
    "secondApprovedAt" TIMESTAMP(3),
    "executedBy" TEXT,
    "executedAt" TIMESTAMP(3),
    "executionResult" JSONB,
    "cancelledBy" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,

    CONSTRAINT "BulkRefundRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chargeback" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "providerDisputeId" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ChargebackStatus" NOT NULL DEFAULT 'NEEDS_RESPONSE',
    "evidencePacket" JSONB,
    "evidenceSubmittedAt" TIMESTAMP(3),
    "evidenceSubmittedBy" TEXT,
    "evidenceDeadline" TIMESTAMP(3),
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderSentAt" TIMESTAMP(3),
    "outcome" TEXT,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Chargeback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donor" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "encryptedName" TEXT NOT NULL,
    "encryptedEmail" TEXT NOT NULL,
    "emailBlindIndex" TEXT NOT NULL,
    "nameBlindIndex" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "anonymizedAt" TIMESTAMP(3),
    "rootsCommune" TEXT,
    "legalHold" BOOLEAN NOT NULL DEFAULT false,
    "legalHoldReason" TEXT,
    "legalHoldSetBy" TEXT,
    "legalHoldSetAt" TIMESTAMP(3),
    "legalHoldReleasedBy" TEXT,
    "legalHoldReleasedAt" TIMESTAMP(3),

    CONSTRAINT "Donor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "donorId" TEXT NOT NULL,
    "purpose" "ConsentPurpose" NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'PENDING',
    "basis" "ConsentBasis" NOT NULL,
    "grantedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "locale" TEXT NOT NULL,
    "consentText" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MySupportSession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "donorId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "MySupportSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetentionPolicy" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "entityType" TEXT NOT NULL,
    "retentionPeriodDays" INTEGER NOT NULL,
    "canAnonymize" BOOLEAN NOT NULL DEFAULT true,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "legalBasis" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacyAuditLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "PrivacyAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL,
    "status" "ChapterStatus" NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "organizerName" TEXT,
    "organizerEmail" TEXT,
    "organizerContactOptIn" BOOLEAN NOT NULL DEFAULT false,
    "descriptionHt" TEXT,
    "descriptionFr" TEXT,
    "descriptionEn" TEXT,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "totalAmountCents" INTEGER NOT NULL DEFAULT 0,
    "showLeaderboard" BOOLEAN NOT NULL DEFAULT false,
    "allowJoin" BOOLEAN NOT NULL DEFAULT true,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendedBy" TEXT,
    "suspendedAt" TIMESTAMP(3),
    "suspensionReason" TEXT,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterMembership" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "chapterId" TEXT NOT NULL,
    "supporterPageId" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "leftAt" TIMESTAMP(3),
    "leftReason" TEXT,
    "removedBy" TEXT,
    "removedAt" TIMESTAMP(3),
    "removedReason" TEXT,

    CONSTRAINT "ChapterMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "chapterId" TEXT NOT NULL,
    "titleHt" TEXT NOT NULL,
    "titleFr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionHt" TEXT,
    "descriptionFr" TEXT,
    "descriptionEn" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "organizerName" TEXT NOT NULL,
    "organizerEmail" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "ChapterEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupporterPage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "donorId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "storyHt" TEXT,
    "storyFr" TEXT,
    "storyEn" TEXT,
    "showName" BOOLEAN NOT NULL DEFAULT true,
    "showRootsCommune" BOOLEAN NOT NULL DEFAULT false,
    "showChapterMembership" BOOLEAN NOT NULL DEFAULT false,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "referralAmountCents" INTEGER NOT NULL DEFAULT 0,
    "status" "SupporterPageStatus" NOT NULL DEFAULT 'ACTIVE',
    "publishedAt" TIMESTAMP(3),
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendedBy" TEXT,
    "suspendedAt" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "reportCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SupporterPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupporterPageReport" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supporterPageId" TEXT NOT NULL,
    "reason" "SupporterPageReportReason" NOT NULL,
    "reasonDetails" TEXT,
    "reporterIp" TEXT NOT NULL,
    "reporterEmail" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "actionTaken" TEXT,

    CONSTRAINT "SupporterPageReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservedSlug" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slug" TEXT NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "ReservedSlug_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RootsAggregate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "communeSlug" TEXT NOT NULL,
    "supporterCount" INTEGER NOT NULL DEFAULT 0,
    "isSuppressed" BOOLEAN NOT NULL DEFAULT false,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RootsAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attribution" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contributionId" TEXT NOT NULL,
    "referrerPageSlug" TEXT,
    "referralSource" TEXT,

    CONSTRAINT "Attribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterModerationLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chapterId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actionBy" TEXT NOT NULL,
    "actionByEmail" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,

    CONSTRAINT "ChapterModerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL,
    "passwordHash" TEXT,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "mfaBackupCodes" TEXT[],
    "mfaEnabledAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendedBy" TEXT,
    "suspendedAt" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "canRevealPII" BOOLEAN NOT NULL DEFAULT false,
    "invitedBy" TEXT,
    "invitedByEmail" TEXT,
    "invitedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedByEmail" TEXT,
    "approvedAt" TIMESTAMP(3),
    "secondApprovedBy" TEXT,
    "secondApprovedByEmail" TEXT,
    "secondApprovedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lastFailedLoginAt" TIMESTAMP(3),
    "piiRevealCount" INTEGER NOT NULL DEFAULT 0,
    "piiRevealResetAt" TIMESTAMP(3),

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedBy" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokeReason" TEXT,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TamperEvidentAuditLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sequenceNumber" BIGINT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "changes" JSONB,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "actorRole" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "previousHash" TEXT NOT NULL,
    "currentHash" TEXT NOT NULL,
    "backedUpAt" TIMESTAMP(3),
    "backupRef" TEXT,

    CONSTRAINT "TamperEvidentAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PIIReveal" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminId" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fields" TEXT[],
    "reason" TEXT NOT NULL,
    "ipAddress" TEXT,

    CONSTRAINT "PIIReveal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSubjectRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requestType" "DataSubjectRequestType" NOT NULL,
    "donorId" TEXT,
    "subjectEmail" TEXT NOT NULL,
    "subjectName" TEXT,
    "status" "DataSubjectRequestStatus" NOT NULL DEFAULT 'PENDING',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationMethod" TEXT,
    "assignedTo" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "dataExportUrl" TEXT,
    "dataExportedAt" TIMESTAMP(3),
    "deletionCompletedAt" TIMESTAMP(3),
    "legalHoldActive" BOOLEAN NOT NULL DEFAULT false,
    "legalHoldReason" TEXT,
    "legalHoldBy" TEXT,
    "legalHoldAt" TIMESTAMP(3),
    "deniedAt" TIMESTAMP(3),
    "deniedBy" TEXT,
    "denialReason" TEXT,
    "contactEmail" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "DataSubjectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackgroundJob" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "jobType" TEXT NOT NULL,
    "jobSubtype" TEXT,
    "status" "BackgroundJobStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledFor" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalItems" INTEGER,
    "processedItems" INTEGER NOT NULL DEFAULT 0,
    "resultUrl" TEXT,
    "resultSize" INTEGER,
    "errorMessage" TEXT,
    "requestedBy" TEXT NOT NULL,
    "requestedByEmail" TEXT NOT NULL,
    "parameters" JSONB,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "timeoutAt" TIMESTAMP(3),

    CONSTRAINT "BackgroundJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertSetting" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "alertKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "threshold" DOUBLE PRECISION,
    "timeWindow" INTEGER,
    "emailRecipients" TEXT[],
    "slackWebhook" TEXT,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'WARNING',
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 60,
    "description" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "AlertSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alertKey" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "value" DOUBLE PRECISION,
    "threshold" DOUBLE PRECISION,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "notifiedTo" TEXT[],
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "relatedType" TEXT,
    "relatedId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "AlertEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthMetric" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "labels" JSONB,

    CONSTRAINT "HealthMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoDataSeed" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seedType" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "executedBy" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cleanedUp" BOOLEAN NOT NULL DEFAULT false,
    "cleanedUpAt" TIMESTAMP(3),

    CONSTRAINT "DemoDataSeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedView" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tableType" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "sortBy" TEXT,
    "sortOrder" TEXT,
    "visibleColumns" TEXT[],
    "userId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SavedView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookFailure" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "httpStatus" INTEGER,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolutionNote" TEXT,

    CONSTRAINT "WebhookFailure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CandidateConfig_slug_key" ON "CandidateConfig"("slug");

-- CreateIndex
CREATE INDEX "CandidateConfig_slug_idx" ON "CandidateConfig"("slug");

-- CreateIndex
CREATE INDEX "LaunchGate_mode_idx" ON "LaunchGate"("mode");

-- CreateIndex
CREATE UNIQUE INDEX "LaunchChecklistItem_itemKey_key" ON "LaunchChecklistItem"("itemKey");

-- CreateIndex
CREATE INDEX "LaunchChecklistItem_category_idx" ON "LaunchChecklistItem"("category");

-- CreateIndex
CREATE INDEX "LaunchChecklistItem_checked_idx" ON "LaunchChecklistItem"("checked");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistSignup_email_key" ON "WaitlistSignup"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistSignup_emailVerificationToken_key" ON "WaitlistSignup"("emailVerificationToken");

-- CreateIndex
CREATE INDEX "WaitlistSignup_email_idx" ON "WaitlistSignup"("email");

-- CreateIndex
CREATE INDEX "WaitlistSignup_country_idx" ON "WaitlistSignup"("country");

-- CreateIndex
CREATE INDEX "WaitlistSignup_communeOfOrigin_idx" ON "WaitlistSignup"("communeOfOrigin");

-- CreateIndex
CREATE INDEX "WaitlistSignup_emailVerified_idx" ON "WaitlistSignup"("emailVerified");

-- CreateIndex
CREATE INDEX "WaitlistSignup_createdAt_idx" ON "WaitlistSignup"("createdAt");

-- CreateIndex
CREATE INDEX "WaitlistSignup_notified_idx" ON "WaitlistSignup"("notified");

-- CreateIndex
CREATE INDEX "WaitlistSignup_unsubscribed_idx" ON "WaitlistSignup"("unsubscribed");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_verificationToken_key" ON "NewsletterSubscriber"("verificationToken");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_email_idx" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_status_idx" ON "NewsletterSubscriber"("status");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_country_idx" ON "NewsletterSubscriber"("country");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_communeOfOrigin_idx" ON "NewsletterSubscriber"("communeOfOrigin");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_chapterId_idx" ON "NewsletterSubscriber"("chapterId");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_verified_idx" ON "NewsletterSubscriber"("verified");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_bounced_idx" ON "NewsletterSubscriber"("bounced");

-- CreateIndex
CREATE UNIQUE INDEX "Newsletter_slug_key" ON "Newsletter"("slug");

-- CreateIndex
CREATE INDEX "Newsletter_status_idx" ON "Newsletter"("status");

-- CreateIndex
CREATE INDEX "Newsletter_scheduledFor_idx" ON "Newsletter"("scheduledFor");

-- CreateIndex
CREATE INDEX "Newsletter_sentAt_idx" ON "Newsletter"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSend_providerMessageId_key" ON "NewsletterSend"("providerMessageId");

-- CreateIndex
CREATE INDEX "NewsletterSend_newsletterId_idx" ON "NewsletterSend"("newsletterId");

-- CreateIndex
CREATE INDEX "NewsletterSend_subscriberId_idx" ON "NewsletterSend"("subscriberId");

-- CreateIndex
CREATE INDEX "NewsletterSend_sentAt_idx" ON "NewsletterSend"("sentAt");

-- CreateIndex
CREATE INDEX "NewsletterSend_openedAt_idx" ON "NewsletterSend"("openedAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSend_newsletterId_subscriberId_key" ON "NewsletterSend"("newsletterId", "subscriberId");

-- CreateIndex
CREATE UNIQUE INDEX "Volunteer_email_key" ON "Volunteer"("email");

-- CreateIndex
CREATE INDEX "Volunteer_email_idx" ON "Volunteer"("email");

-- CreateIndex
CREATE INDEX "Volunteer_status_idx" ON "Volunteer"("status");

-- CreateIndex
CREATE INDEX "Volunteer_country_idx" ON "Volunteer"("country");

-- CreateIndex
CREATE INDEX "Volunteer_skills_idx" ON "Volunteer"("skills");

-- CreateIndex
CREATE INDEX "VolunteerAssignment_volunteerId_idx" ON "VolunteerAssignment"("volunteerId");

-- CreateIndex
CREATE INDEX "VolunteerAssignment_status_idx" ON "VolunteerAssignment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_slug_idx" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Event_startDateTime_idx" ON "Event"("startDateTime");

-- CreateIndex
CREATE INDEX "Event_chapterId_idx" ON "Event"("chapterId");

-- CreateIndex
CREATE INDEX "EventRSVP_eventId_idx" ON "EventRSVP"("eventId");

-- CreateIndex
CREATE INDEX "EventRSVP_email_idx" ON "EventRSVP"("email");

-- CreateIndex
CREATE INDEX "EventRSVP_status_idx" ON "EventRSVP"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EventRSVP_eventId_email_key" ON "EventRSVP"("eventId", "email");

-- CreateIndex
CREATE INDEX "Question_status_idx" ON "Question"("status");

-- CreateIndex
CREATE INDEX "Question_createdAt_idx" ON "Question"("createdAt");

-- CreateIndex
CREATE INDEX "Question_email_idx" ON "Question"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CannedReply_slug_key" ON "CannedReply"("slug");

-- CreateIndex
CREATE INDEX "CannedReply_slug_idx" ON "CannedReply"("slug");

-- CreateIndex
CREATE INDEX "SubscriberExport_exportedBy_idx" ON "SubscriberExport"("exportedBy");

-- CreateIndex
CREATE INDEX "SubscriberExport_createdAt_idx" ON "SubscriberExport"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Content_slug_key" ON "Content"("slug");

-- CreateIndex
CREATE INDEX "Content_slug_idx" ON "Content"("slug");

-- CreateIndex
CREATE INDEX "Content_status_idx" ON "Content"("status");

-- CreateIndex
CREATE INDEX "Content_category_idx" ON "Content"("category");

-- CreateIndex
CREATE INDEX "Content_order_idx" ON "Content"("order");

-- CreateIndex
CREATE INDEX "ContentSource_contentId_idx" ON "ContentSource"("contentId");

-- CreateIndex
CREATE INDEX "IntakeSubmission_status_idx" ON "IntakeSubmission"("status");

-- CreateIndex
CREATE INDEX "IntakeSubmission_category_idx" ON "IntakeSubmission"("category");

-- CreateIndex
CREATE INDEX "IntakeSubmission_createdAt_idx" ON "IntakeSubmission"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "IntakeChecklist_itemKey_key" ON "IntakeChecklist"("itemKey");

-- CreateIndex
CREATE INDEX "IntakeChecklist_completed_idx" ON "IntakeChecklist"("completed");

-- CreateIndex
CREATE INDEX "IntakeChecklist_category_idx" ON "IntakeChecklist"("category");

-- CreateIndex
CREATE INDEX "FAQ_status_idx" ON "FAQ"("status");

-- CreateIndex
CREATE INDEX "FAQ_order_idx" ON "FAQ"("order");

-- CreateIndex
CREATE INDEX "FAQ_featured_idx" ON "FAQ"("featured");

-- CreateIndex
CREATE INDEX "FAQSource_faqId_idx" ON "FAQSource"("faqId");

-- CreateIndex
CREATE UNIQUE INDEX "Contribution_paymentIntentId_key" ON "Contribution"("paymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "Contribution_receiptNumber_key" ON "Contribution"("receiptNumber");

-- CreateIndex
CREATE INDEX "Contribution_donorEmail_idx" ON "Contribution"("donorEmail");

-- CreateIndex
CREATE INDEX "Contribution_paymentStatus_idx" ON "Contribution"("paymentStatus");

-- CreateIndex
CREATE INDEX "Contribution_createdAt_idx" ON "Contribution"("createdAt");

-- CreateIndex
CREATE INDEX "Contribution_paymentIntentId_idx" ON "Contribution"("paymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_providerIntentId_key" ON "PaymentIntent"("providerIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_complianceCheckId_key" ON "PaymentIntent"("complianceCheckId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_contributionId_key" ON "PaymentIntent"("contributionId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_idempotencyKey_key" ON "PaymentIntent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentIntent_provider_idx" ON "PaymentIntent"("provider");

-- CreateIndex
CREATE INDEX "PaymentIntent_status_idx" ON "PaymentIntent"("status");

-- CreateIndex
CREATE INDEX "PaymentIntent_createdAt_idx" ON "PaymentIntent"("createdAt");

-- CreateIndex
CREATE INDEX "PaymentIntent_providerIntentId_idx" ON "PaymentIntent"("providerIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_providerEventId_key" ON "WebhookEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "WebhookEvent_provider_idx" ON "WebhookEvent"("provider");

-- CreateIndex
CREATE INDEX "WebhookEvent_providerEventId_idx" ON "WebhookEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "WebhookEvent_processed_idx" ON "WebhookEvent"("processed");

-- CreateIndex
CREATE INDEX "WebhookEvent_createdAt_idx" ON "WebhookEvent"("createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_paymentIntentId_idx" ON "LedgerEntry"("paymentIntentId");

-- CreateIndex
CREATE INDEX "LedgerEntry_account_idx" ON "LedgerEntry"("account");

-- CreateIndex
CREATE INDEX "LedgerEntry_entryType_idx" ON "LedgerEntry"("entryType");

-- CreateIndex
CREATE INDEX "LedgerEntry_createdAt_idx" ON "LedgerEntry"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_emailBlindIndex_key" ON "Contact"("emailBlindIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_phoneBlindIndex_key" ON "Contact"("phoneBlindIndex");

-- CreateIndex
CREATE INDEX "Contact_emailBlindIndex_idx" ON "Contact"("emailBlindIndex");

-- CreateIndex
CREATE INDEX "Contact_phoneBlindIndex_idx" ON "Contact"("phoneBlindIndex");

-- CreateIndex
CREATE INDEX "Contact_country_idx" ON "Contact"("country");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelConsent_verificationToken_key" ON "ChannelConsent"("verificationToken");

-- CreateIndex
CREATE INDEX "ChannelConsent_contactId_idx" ON "ChannelConsent"("contactId");

-- CreateIndex
CREATE INDEX "ChannelConsent_channel_idx" ON "ChannelConsent"("channel");

-- CreateIndex
CREATE INDEX "ChannelConsent_topic_idx" ON "ChannelConsent"("topic");

-- CreateIndex
CREATE INDEX "ChannelConsent_status_idx" ON "ChannelConsent"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelConsent_contactId_channel_topic_key" ON "ChannelConsent"("contactId", "channel", "topic");

-- CreateIndex
CREATE INDEX "Suppression_contactId_idx" ON "Suppression"("contactId");

-- CreateIndex
CREATE INDEX "Suppression_suppressionType_idx" ON "Suppression"("suppressionType");

-- CreateIndex
CREATE INDEX "Suppression_channel_idx" ON "Suppression"("channel");

-- CreateIndex
CREATE INDEX "MessageLog_contactId_idx" ON "MessageLog"("contactId");

-- CreateIndex
CREATE INDEX "MessageLog_channel_idx" ON "MessageLog"("channel");

-- CreateIndex
CREATE INDEX "MessageLog_topic_idx" ON "MessageLog"("topic");

-- CreateIndex
CREATE INDEX "MessageLog_status_idx" ON "MessageLog"("status");

-- CreateIndex
CREATE INDEX "MessageLog_sentAt_idx" ON "MessageLog"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelConfig_channel_key" ON "ChannelConfig"("channel");

-- CreateIndex
CREATE INDEX "ChannelConfig_channel_idx" ON "ChannelConfig"("channel");

-- CreateIndex
CREATE INDEX "ChannelConfig_enabled_idx" ON "ChannelConfig"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentTextVersion_version_key" ON "ConsentTextVersion"("version");

-- CreateIndex
CREATE INDEX "ConsentTextVersion_active_idx" ON "ConsentTextVersion"("active");

-- CreateIndex
CREATE INDEX "ConsentTextVersion_version_idx" ON "ConsentTextVersion"("version");

-- CreateIndex
CREATE INDEX "WhatsAppConfig_guidelinesReviewed_idx" ON "WhatsAppConfig"("guidelinesReviewed");

-- CreateIndex
CREATE UNIQUE INDEX "Message_slug_key" ON "Message"("slug");

-- CreateIndex
CREATE INDEX "Message_status_idx" ON "Message"("status");

-- CreateIndex
CREATE INDEX "Message_scheduledFor_idx" ON "Message"("scheduledFor");

-- CreateIndex
CREATE INDEX "Message_topic_idx" ON "Message"("topic");

-- CreateIndex
CREATE INDEX "Message_createdBy_idx" ON "Message"("createdBy");

-- CreateIndex
CREATE INDEX "MessageVariant_messageId_idx" ON "MessageVariant"("messageId");

-- CreateIndex
CREATE INDEX "MessageVariant_channel_idx" ON "MessageVariant"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "MessageVariant_messageId_channel_locale_key" ON "MessageVariant"("messageId", "channel", "locale");

-- CreateIndex
CREATE INDEX "TestSend_messageId_idx" ON "TestSend"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryJob_idempotencyKey_key" ON "DeliveryJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "DeliveryJob_messageId_idx" ON "DeliveryJob"("messageId");

-- CreateIndex
CREATE INDEX "DeliveryJob_status_idx" ON "DeliveryJob"("status");

-- CreateIndex
CREATE INDEX "DeliveryJob_channel_idx" ON "DeliveryJob"("channel");

-- CreateIndex
CREATE INDEX "MessageAudience_messageId_idx" ON "MessageAudience"("messageId");

-- CreateIndex
CREATE INDEX "WhatsAppChannelTask_messageId_idx" ON "WhatsAppChannelTask"("messageId");

-- CreateIndex
CREATE INDEX "WhatsAppChannelTask_assignedTo_idx" ON "WhatsAppChannelTask"("assignedTo");

-- CreateIndex
CREATE INDEX "WhatsAppChannelTask_status_idx" ON "WhatsAppChannelTask"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MessageSendRecord_idempotencyKey_key" ON "MessageSendRecord"("idempotencyKey");

-- CreateIndex
CREATE INDEX "MessageSendRecord_messageId_idx" ON "MessageSendRecord"("messageId");

-- CreateIndex
CREATE INDEX "MessageSendRecord_contactId_idx" ON "MessageSendRecord"("contactId");

-- CreateIndex
CREATE INDEX "MessageSendRecord_status_idx" ON "MessageSendRecord"("status");

-- CreateIndex
CREATE INDEX "MessageSendRecord_channel_idx" ON "MessageSendRecord"("channel");

-- CreateIndex
CREATE INDEX "MessageSendRecord_providerMessageId_idx" ON "MessageSendRecord"("providerMessageId");

-- CreateIndex
CREATE INDEX "MessageSendRecord_queuedAt_idx" ON "MessageSendRecord"("queuedAt");

-- CreateIndex
CREATE INDEX "FrequencyCap_contactId_idx" ON "FrequencyCap"("contactId");

-- CreateIndex
CREATE INDEX "FrequencyCap_windowEnd_idx" ON "FrequencyCap"("windowEnd");

-- CreateIndex
CREATE UNIQUE INDEX "FrequencyCap_contactId_windowStart_key" ON "FrequencyCap"("contactId", "windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelPause_channel_key" ON "ChannelPause"("channel");

-- CreateIndex
CREATE INDEX "ChannelPause_channel_idx" ON "ChannelPause"("channel");

-- CreateIndex
CREATE INDEX "ChannelPause_paused_idx" ON "ChannelPause"("paused");

-- CreateIndex
CREATE INDEX "Alert_alertType_idx" ON "Alert"("alertType");

-- CreateIndex
CREATE INDEX "Alert_severity_idx" ON "Alert"("severity");

-- CreateIndex
CREATE INDEX "Alert_acknowledged_idx" ON "Alert"("acknowledged");

-- CreateIndex
CREATE INDEX "Alert_resolved_idx" ON "Alert"("resolved");

-- CreateIndex
CREATE UNIQUE INDEX "MessageTemplate_slug_key" ON "MessageTemplate"("slug");

-- CreateIndex
CREATE INDEX "MessageTemplate_channel_idx" ON "MessageTemplate"("channel");

-- CreateIndex
CREATE INDEX "MessageTemplate_topic_idx" ON "MessageTemplate"("topic");

-- CreateIndex
CREATE INDEX "RecipientConfig_isActive_idx" ON "RecipientConfig"("isActive");

-- CreateIndex
CREATE INDEX "RecipientConfig_provider_idx" ON "RecipientConfig"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "TransferRequest_providerTransferId_key" ON "TransferRequest"("providerTransferId");

-- CreateIndex
CREATE INDEX "TransferRequest_status_idx" ON "TransferRequest"("status");

-- CreateIndex
CREATE INDEX "TransferRequest_createdAt_idx" ON "TransferRequest"("createdAt");

-- CreateIndex
CREATE INDEX "ReconciliationRun_provider_idx" ON "ReconciliationRun"("provider");

-- CreateIndex
CREATE INDEX "ReconciliationRun_status_idx" ON "ReconciliationRun"("status");

-- CreateIndex
CREATE INDEX "ReconciliationRun_createdAt_idx" ON "ReconciliationRun"("createdAt");

-- CreateIndex
CREATE INDEX "ComplianceRule_ruleType_idx" ON "ComplianceRule"("ruleType");

-- CreateIndex
CREATE INDEX "ComplianceRule_isActive_idx" ON "ComplianceRule"("isActive");

-- CreateIndex
CREATE INDEX "ComplianceRule_effectiveFrom_idx" ON "ComplianceRule"("effectiveFrom");

-- CreateIndex
CREATE INDEX "ComplianceRuleVersion_ruleId_idx" ON "ComplianceRuleVersion"("ruleId");

-- CreateIndex
CREATE INDEX "ComplianceRuleVersion_status_idx" ON "ComplianceRuleVersion"("status");

-- CreateIndex
CREATE INDEX "ComplianceRuleVersion_version_idx" ON "ComplianceRuleVersion"("version");

-- CreateIndex
CREATE UNIQUE INDEX "EligibilityAttestation_key_key" ON "EligibilityAttestation"("key");

-- CreateIndex
CREATE INDEX "EligibilityAttestation_key_idx" ON "EligibilityAttestation"("key");

-- CreateIndex
CREATE INDEX "EligibilityAttestation_isActive_idx" ON "EligibilityAttestation"("isActive");

-- CreateIndex
CREATE INDEX "EligibilityAttestation_version_idx" ON "EligibilityAttestation"("version");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceCheck_contributionId_key" ON "ComplianceCheck"("contributionId");

-- CreateIndex
CREATE INDEX "ComplianceCheck_donorEmailNormalized_idx" ON "ComplianceCheck"("donorEmailNormalized");

-- CreateIndex
CREATE INDEX "ComplianceCheck_donorFingerprint_idx" ON "ComplianceCheck"("donorFingerprint");

-- CreateIndex
CREATE INDEX "ComplianceCheck_result_idx" ON "ComplianceCheck"("result");

-- CreateIndex
CREATE INDEX "ComplianceCheck_reviewStatus_idx" ON "ComplianceCheck"("reviewStatus");

-- CreateIndex
CREATE INDEX "ComplianceCheck_createdAt_idx" ON "ComplianceCheck"("createdAt");

-- CreateIndex
CREATE INDEX "SanctionsScreening_status_idx" ON "SanctionsScreening"("status");

-- CreateIndex
CREATE INDEX "SanctionsScreening_donorEmail_idx" ON "SanctionsScreening"("donorEmail");

-- CreateIndex
CREATE INDEX "SanctionsScreening_createdAt_idx" ON "SanctionsScreening"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DonorBlocklist_emailNormalized_key" ON "DonorBlocklist"("emailNormalized");

-- CreateIndex
CREATE INDEX "DonorBlocklist_emailNormalized_idx" ON "DonorBlocklist"("emailNormalized");

-- CreateIndex
CREATE INDEX "DonorBlocklist_fingerprint_idx" ON "DonorBlocklist"("fingerprint");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_slug_key" ON "Issue"("slug");

-- CreateIndex
CREATE INDEX "Issue_slug_idx" ON "Issue"("slug");

-- CreateIndex
CREATE INDEX "Issue_status_idx" ON "Issue"("status");

-- CreateIndex
CREATE INDEX "Issue_order_idx" ON "Issue"("order");

-- CreateIndex
CREATE INDEX "IssueSource_issueId_idx" ON "IssueSource"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "Update_slug_key" ON "Update"("slug");

-- CreateIndex
CREATE INDEX "Update_slug_idx" ON "Update"("slug");

-- CreateIndex
CREATE INDEX "Update_status_idx" ON "Update"("status");

-- CreateIndex
CREATE INDEX "Update_publishedAt_idx" ON "Update"("publishedAt");

-- CreateIndex
CREATE INDEX "Update_featured_idx" ON "Update"("featured");

-- CreateIndex
CREATE INDEX "PressKit_published_idx" ON "PressKit"("published");

-- CreateIndex
CREATE UNIQUE INDEX "Commune_slug_key" ON "Commune"("slug");

-- CreateIndex
CREATE INDEX "Commune_slug_idx" ON "Commune"("slug");

-- CreateIndex
CREATE INDEX "Commune_arrondissement_idx" ON "Commune"("arrondissement");

-- CreateIndex
CREATE INDEX "Commune_order_idx" ON "Commune"("order");

-- CreateIndex
CREATE UNIQUE INDEX "NewsArticle_url_key" ON "NewsArticle"("url");

-- CreateIndex
CREATE INDEX "NewsArticle_status_idx" ON "NewsArticle"("status");

-- CreateIndex
CREATE INDEX "NewsArticle_publishedAt_idx" ON "NewsArticle"("publishedAt");

-- CreateIndex
CREATE INDEX "NewsArticle_matchTier_idx" ON "NewsArticle"("matchTier");

-- CreateIndex
CREATE INDEX "NewsArticle_contentType_idx" ON "NewsArticle"("contentType");

-- CreateIndex
CREATE INDEX "NewsArticle_outlet_idx" ON "NewsArticle"("outlet");

-- CreateIndex
CREATE INDEX "NewsArticle_domain_idx" ON "NewsArticle"("domain");

-- CreateIndex
CREATE INDEX "NewsArticle_sourceId_idx" ON "NewsArticle"("sourceId");

-- CreateIndex
CREATE INDEX "NewsArticle_hiddenAt_idx" ON "NewsArticle"("hiddenAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsSource_name_key" ON "NewsSource"("name");

-- CreateIndex
CREATE INDEX "NewsSource_sourceType_idx" ON "NewsSource"("sourceType");

-- CreateIndex
CREATE INDEX "NewsSource_enabled_idx" ON "NewsSource"("enabled");

-- CreateIndex
CREATE INDEX "NewsQuery_enabled_idx" ON "NewsQuery"("enabled");

-- CreateIndex
CREATE INDEX "IngestionRun_createdAt_idx" ON "IngestionRun"("createdAt");

-- CreateIndex
CREATE INDEX "IngestionRun_sourceType_idx" ON "IngestionRun"("sourceType");

-- CreateIndex
CREATE INDEX "IngestionRun_status_idx" ON "IngestionRun"("status");

-- CreateIndex
CREATE INDEX "FraudEvent_eventType_idx" ON "FraudEvent"("eventType");

-- CreateIndex
CREATE INDEX "FraudEvent_severity_idx" ON "FraudEvent"("severity");

-- CreateIndex
CREATE INDEX "FraudEvent_createdAt_idx" ON "FraudEvent"("createdAt");

-- CreateIndex
CREATE INDEX "FraudEvent_ipAddress_idx" ON "FraudEvent"("ipAddress");

-- CreateIndex
CREATE INDEX "FraudEvent_email_idx" ON "FraudEvent"("email");

-- CreateIndex
CREATE INDEX "FraudEvent_contributionId_idx" ON "FraudEvent"("contributionId");

-- CreateIndex
CREATE INDEX "ManualReviewItem_status_idx" ON "ManualReviewItem"("status");

-- CreateIndex
CREATE INDEX "ManualReviewItem_contributionId_idx" ON "ManualReviewItem"("contributionId");

-- CreateIndex
CREATE INDEX "ManualReviewItem_createdAt_idx" ON "ManualReviewItem"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_contributionId_key" ON "EmailVerificationToken"("contributionId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_token_idx" ON "EmailVerificationToken"("token");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_expiresAt_idx" ON "EmailVerificationToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber");

-- CreateIndex
CREATE INDEX "Receipt_contributionId_idx" ON "Receipt"("contributionId");

-- CreateIndex
CREATE INDEX "Receipt_receiptNumber_idx" ON "Receipt"("receiptNumber");

-- CreateIndex
CREATE INDEX "Receipt_createdAt_idx" ON "Receipt"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefundMagicLink_token_key" ON "RefundMagicLink"("token");

-- CreateIndex
CREATE INDEX "RefundMagicLink_token_idx" ON "RefundMagicLink"("token");

-- CreateIndex
CREATE INDEX "RefundMagicLink_contributionId_idx" ON "RefundMagicLink"("contributionId");

-- CreateIndex
CREATE INDEX "RefundMagicLink_expiresAt_idx" ON "RefundMagicLink"("expiresAt");

-- CreateIndex
CREATE INDEX "RefundTicket_status_idx" ON "RefundTicket"("status");

-- CreateIndex
CREATE INDEX "RefundTicket_contributionId_idx" ON "RefundTicket"("contributionId");

-- CreateIndex
CREATE INDEX "RefundTicket_createdAt_idx" ON "RefundTicket"("createdAt");

-- CreateIndex
CREATE INDEX "BulkRefundRequest_status_idx" ON "BulkRefundRequest"("status");

-- CreateIndex
CREATE INDEX "BulkRefundRequest_createdAt_idx" ON "BulkRefundRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Chargeback_providerDisputeId_key" ON "Chargeback"("providerDisputeId");

-- CreateIndex
CREATE INDEX "Chargeback_status_idx" ON "Chargeback"("status");

-- CreateIndex
CREATE INDEX "Chargeback_contributionId_idx" ON "Chargeback"("contributionId");

-- CreateIndex
CREATE INDEX "Chargeback_evidenceDeadline_idx" ON "Chargeback"("evidenceDeadline");

-- CreateIndex
CREATE INDEX "Chargeback_createdAt_idx" ON "Chargeback"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Donor_emailBlindIndex_key" ON "Donor"("emailBlindIndex");

-- CreateIndex
CREATE INDEX "Donor_emailBlindIndex_idx" ON "Donor"("emailBlindIndex");

-- CreateIndex
CREATE INDEX "Donor_nameBlindIndex_idx" ON "Donor"("nameBlindIndex");

-- CreateIndex
CREATE INDEX "Donor_legalHold_idx" ON "Donor"("legalHold");

-- CreateIndex
CREATE INDEX "Donor_anonymizedAt_idx" ON "Donor"("anonymizedAt");

-- CreateIndex
CREATE INDEX "Donor_rootsCommune_idx" ON "Donor"("rootsCommune");

-- CreateIndex
CREATE INDEX "Consent_donorId_idx" ON "Consent"("donorId");

-- CreateIndex
CREATE INDEX "Consent_purpose_status_idx" ON "Consent"("purpose", "status");

-- CreateIndex
CREATE INDEX "Consent_grantedAt_idx" ON "Consent"("grantedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MySupportSession_token_key" ON "MySupportSession"("token");

-- CreateIndex
CREATE INDEX "MySupportSession_donorId_idx" ON "MySupportSession"("donorId");

-- CreateIndex
CREATE INDEX "MySupportSession_token_idx" ON "MySupportSession"("token");

-- CreateIndex
CREATE INDEX "MySupportSession_expiresAt_idx" ON "MySupportSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RetentionPolicy_entityType_key" ON "RetentionPolicy"("entityType");

-- CreateIndex
CREATE INDEX "RetentionPolicy_entityType_idx" ON "RetentionPolicy"("entityType");

-- CreateIndex
CREATE INDEX "PrivacyAuditLog_action_idx" ON "PrivacyAuditLog"("action");

-- CreateIndex
CREATE INDEX "PrivacyAuditLog_entityType_entityId_idx" ON "PrivacyAuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "PrivacyAuditLog_createdAt_idx" ON "PrivacyAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_slug_key" ON "Chapter"("slug");

-- CreateIndex
CREATE INDEX "Chapter_slug_idx" ON "Chapter"("slug");

-- CreateIndex
CREATE INDEX "Chapter_status_idx" ON "Chapter"("status");

-- CreateIndex
CREATE INDEX "Chapter_country_idx" ON "Chapter"("country");

-- CreateIndex
CREATE INDEX "Chapter_suspended_idx" ON "Chapter"("suspended");

-- CreateIndex
CREATE INDEX "ChapterMembership_chapterId_idx" ON "ChapterMembership"("chapterId");

-- CreateIndex
CREATE INDEX "ChapterMembership_supporterPageId_idx" ON "ChapterMembership"("supporterPageId");

-- CreateIndex
CREATE INDEX "ChapterMembership_status_idx" ON "ChapterMembership"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ChapterMembership_chapterId_supporterPageId_key" ON "ChapterMembership"("chapterId", "supporterPageId");

-- CreateIndex
CREATE INDEX "ChapterEvent_chapterId_idx" ON "ChapterEvent"("chapterId");

-- CreateIndex
CREATE INDEX "ChapterEvent_eventDate_idx" ON "ChapterEvent"("eventDate");

-- CreateIndex
CREATE INDEX "ChapterEvent_status_idx" ON "ChapterEvent"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SupporterPage_donorId_key" ON "SupporterPage"("donorId");

-- CreateIndex
CREATE UNIQUE INDEX "SupporterPage_slug_key" ON "SupporterPage"("slug");

-- CreateIndex
CREATE INDEX "SupporterPage_slug_idx" ON "SupporterPage"("slug");

-- CreateIndex
CREATE INDEX "SupporterPage_status_idx" ON "SupporterPage"("status");

-- CreateIndex
CREATE INDEX "SupporterPage_suspended_idx" ON "SupporterPage"("suspended");

-- CreateIndex
CREATE INDEX "SupporterPage_publishedAt_idx" ON "SupporterPage"("publishedAt");

-- CreateIndex
CREATE INDEX "SupporterPageReport_supporterPageId_idx" ON "SupporterPageReport"("supporterPageId");

-- CreateIndex
CREATE INDEX "SupporterPageReport_status_idx" ON "SupporterPageReport"("status");

-- CreateIndex
CREATE INDEX "SupporterPageReport_createdAt_idx" ON "SupporterPageReport"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReservedSlug_slug_key" ON "ReservedSlug"("slug");

-- CreateIndex
CREATE INDEX "ReservedSlug_slug_idx" ON "ReservedSlug"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "RootsAggregate_communeSlug_key" ON "RootsAggregate"("communeSlug");

-- CreateIndex
CREATE INDEX "RootsAggregate_communeSlug_idx" ON "RootsAggregate"("communeSlug");

-- CreateIndex
CREATE INDEX "RootsAggregate_supporterCount_idx" ON "RootsAggregate"("supporterCount");

-- CreateIndex
CREATE UNIQUE INDEX "Attribution_contributionId_key" ON "Attribution"("contributionId");

-- CreateIndex
CREATE INDEX "Attribution_referrerPageSlug_idx" ON "Attribution"("referrerPageSlug");

-- CreateIndex
CREATE INDEX "Attribution_createdAt_idx" ON "Attribution"("createdAt");

-- CreateIndex
CREATE INDEX "ChapterModerationLog_chapterId_idx" ON "ChapterModerationLog"("chapterId");

-- CreateIndex
CREATE INDEX "ChapterModerationLog_createdAt_idx" ON "ChapterModerationLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_email_idx" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_role_idx" ON "AdminUser"("role");

-- CreateIndex
CREATE INDEX "AdminUser_active_idx" ON "AdminUser"("active");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_token_key" ON "AdminSession"("token");

-- CreateIndex
CREATE INDEX "AdminSession_userId_idx" ON "AdminSession"("userId");

-- CreateIndex
CREATE INDEX "AdminSession_token_idx" ON "AdminSession"("token");

-- CreateIndex
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AdminSession_revoked_idx" ON "AdminSession"("revoked");

-- CreateIndex
CREATE UNIQUE INDEX "TamperEvidentAuditLog_sequenceNumber_key" ON "TamperEvidentAuditLog"("sequenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TamperEvidentAuditLog_currentHash_key" ON "TamperEvidentAuditLog"("currentHash");

-- CreateIndex
CREATE INDEX "TamperEvidentAuditLog_sequenceNumber_idx" ON "TamperEvidentAuditLog"("sequenceNumber");

-- CreateIndex
CREATE INDEX "TamperEvidentAuditLog_action_idx" ON "TamperEvidentAuditLog"("action");

-- CreateIndex
CREATE INDEX "TamperEvidentAuditLog_entityType_entityId_idx" ON "TamperEvidentAuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "TamperEvidentAuditLog_actorId_idx" ON "TamperEvidentAuditLog"("actorId");

-- CreateIndex
CREATE INDEX "TamperEvidentAuditLog_createdAt_idx" ON "TamperEvidentAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "PIIReveal_adminId_idx" ON "PIIReveal"("adminId");

-- CreateIndex
CREATE INDEX "PIIReveal_entityType_entityId_idx" ON "PIIReveal"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "PIIReveal_createdAt_idx" ON "PIIReveal"("createdAt");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_donorId_idx" ON "DataSubjectRequest"("donorId");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_subjectEmail_idx" ON "DataSubjectRequest"("subjectEmail");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_status_idx" ON "DataSubjectRequest"("status");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_requestType_idx" ON "DataSubjectRequest"("requestType");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_createdAt_idx" ON "DataSubjectRequest"("createdAt");

-- CreateIndex
CREATE INDEX "BackgroundJob_jobType_idx" ON "BackgroundJob"("jobType");

-- CreateIndex
CREATE INDEX "BackgroundJob_status_idx" ON "BackgroundJob"("status");

-- CreateIndex
CREATE INDEX "BackgroundJob_requestedBy_idx" ON "BackgroundJob"("requestedBy");

-- CreateIndex
CREATE INDEX "BackgroundJob_createdAt_idx" ON "BackgroundJob"("createdAt");

-- CreateIndex
CREATE INDEX "BackgroundJob_scheduledFor_idx" ON "BackgroundJob"("scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "AlertSetting_alertKey_key" ON "AlertSetting"("alertKey");

-- CreateIndex
CREATE INDEX "AlertSetting_alertKey_idx" ON "AlertSetting"("alertKey");

-- CreateIndex
CREATE INDEX "AlertSetting_enabled_idx" ON "AlertSetting"("enabled");

-- CreateIndex
CREATE INDEX "AlertEvent_alertKey_idx" ON "AlertEvent"("alertKey");

-- CreateIndex
CREATE INDEX "AlertEvent_createdAt_idx" ON "AlertEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AlertEvent_acknowledged_idx" ON "AlertEvent"("acknowledged");

-- CreateIndex
CREATE INDEX "HealthMetric_metricType_timestamp_idx" ON "HealthMetric"("metricType", "timestamp");

-- CreateIndex
CREATE INDEX "HealthMetric_createdAt_idx" ON "HealthMetric"("createdAt");

-- CreateIndex
CREATE INDEX "DemoDataSeed_environment_idx" ON "DemoDataSeed"("environment");

-- CreateIndex
CREATE INDEX "DemoDataSeed_createdAt_idx" ON "DemoDataSeed"("createdAt");

-- CreateIndex
CREATE INDEX "SavedView_userId_idx" ON "SavedView"("userId");

-- CreateIndex
CREATE INDEX "SavedView_tableType_idx" ON "SavedView"("tableType");

-- CreateIndex
CREATE INDEX "WebhookFailure_provider_idx" ON "WebhookFailure"("provider");

-- CreateIndex
CREATE INDEX "WebhookFailure_resolved_idx" ON "WebhookFailure"("resolved");

-- CreateIndex
CREATE INDEX "WebhookFailure_createdAt_idx" ON "WebhookFailure"("createdAt");

-- AddForeignKey
ALTER TABLE "NewsletterSubscriber" ADD CONSTRAINT "NewsletterSubscriber_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterSend" ADD CONSTRAINT "NewsletterSend_newsletterId_fkey" FOREIGN KEY ("newsletterId") REFERENCES "Newsletter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterSend" ADD CONSTRAINT "NewsletterSend_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "NewsletterSubscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerAssignment" ADD CONSTRAINT "VolunteerAssignment_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "Volunteer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRSVP" ADD CONSTRAINT "EventRSVP_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_cannedReplyId_fkey" FOREIGN KEY ("cannedReplyId") REFERENCES "CannedReply"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSource" ADD CONSTRAINT "ContentSource_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FAQSource" ADD CONSTRAINT "FAQSource_faqId_fkey" FOREIGN KEY ("faqId") REFERENCES "FAQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_complianceCheckId_fkey" FOREIGN KEY ("complianceCheckId") REFERENCES "ComplianceCheck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelConsent" ADD CONSTRAINT "ChannelConsent_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suppression" ADD CONSTRAINT "Suppression_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageVariant" ADD CONSTRAINT "MessageVariant_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSend" ADD CONSTRAINT "TestSend_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryJob" ADD CONSTRAINT "DeliveryJob_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageAudience" ADD CONSTRAINT "MessageAudience_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppChannelTask" ADD CONSTRAINT "WhatsAppChannelTask_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_recipientConfigId_fkey" FOREIGN KEY ("recipientConfigId") REFERENCES "RecipientConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRuleVersion" ADD CONSTRAINT "ComplianceRuleVersion_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ComplianceRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueSource" ADD CONSTRAINT "IssueSource_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsArticle" ADD CONSTRAINT "NewsArticle_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "NewsSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsArticle" ADD CONSTRAINT "NewsArticle_ingestionRunId_fkey" FOREIGN KEY ("ingestionRunId") REFERENCES "IngestionRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudEvent" ADD CONSTRAINT "FraudEvent_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualReviewItem" ADD CONSTRAINT "ManualReviewItem_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundMagicLink" ADD CONSTRAINT "RefundMagicLink_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundTicket" ADD CONSTRAINT "RefundTicket_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chargeback" ADD CONSTRAINT "Chargeback_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MySupportSession" ADD CONSTRAINT "MySupportSession_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterMembership" ADD CONSTRAINT "ChapterMembership_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterMembership" ADD CONSTRAINT "ChapterMembership_supporterPageId_fkey" FOREIGN KEY ("supporterPageId") REFERENCES "SupporterPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterEvent" ADD CONSTRAINT "ChapterEvent_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupporterPage" ADD CONSTRAINT "SupporterPage_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupporterPageReport" ADD CONSTRAINT "SupporterPageReport_supporterPageId_fkey" FOREIGN KEY ("supporterPageId") REFERENCES "SupporterPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attribution" ADD CONSTRAINT "Attribution_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterModerationLog" ADD CONSTRAINT "ChapterModerationLog_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TamperEvidentAuditLog" ADD CONSTRAINT "TamperEvidentAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PIIReveal" ADD CONSTRAINT "PIIReveal_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSubjectRequest" ADD CONSTRAINT "DataSubjectRequest_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSubjectRequest" ADD CONSTRAINT "DataSubjectRequest_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
┌─────────────────────────────────────────────────────────┐
│  Update available 6.19.3 -> 8.0.0-rc.34                 │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘

