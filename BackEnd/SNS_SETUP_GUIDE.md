# AWS SNS Setup Guide for MFA

This guide will walk you through setting up AWS SNS (Simple Notification Service) to send MFA codes via email.

## Prerequisites

- AWS Account
- AWS Access Key ID and Secret Access Key
- Email address to receive MFA codes

---

## Option 1: Quick Setup (Console Logging - No SNS Required)

If you just want to test the MFA functionality without setting up SNS:

**The system will automatically log MFA codes to the console!**

Just make sure these are set in your `.env`:
```bash
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
# Leave SNS_TOPIC_ARN empty or remove it
SNS_TOPIC_ARN=
```

When you login, the MFA code will be printed in the backend console:
```
=== EMAIL VIA SNS (Console Mode) ===
To: user@example.com
Subject: Your Verification Code
Code: 123456
====================================
```

---

## Option 2: Full SNS Setup (Real Emails)

### Step 1: Create an SNS Topic

1. **Go to AWS Console**: https://console.aws.amazon.com/sns/
2. **Select Region**: Choose your region (e.g., `us-east-1`)
3. **Create Topic**:
   - Click "Topics" in the left sidebar
   - Click "Create topic"
   - **Type**: Standard
   - **Name**: `ClassRegistrationMFA`
   - **Display name**: `Class Registration`
   - Click "Create topic"

4. **Copy the Topic ARN**:
   - After creation, you'll see the ARN
   - Example: `arn:aws:sns:us-east-1:123456789012:ClassRegistrationMFA`
   - Copy this ARN

### Step 2: Configure IAM Permissions

Your AWS user needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish",
        "sns:Subscribe",
        "sns:Unsubscribe",
        "sns:ListSubscriptionsByTopic"
      ],
      "Resource": "arn:aws:sns:us-east-1:123456789012:ClassRegistrationMFA"
    }
  ]
}
```

**To add permissions:**
1. Go to IAM Console: https://console.aws.amazon.com/iam/
2. Click "Users" → Select your user
3. Click "Add permissions" → "Attach policies directly"
4. Create a custom policy with the JSON above
5. Or attach the `AmazonSNSFullAccess` policy (broader permissions)

### Step 3: Update Environment Variables

Add the SNS Topic ARN to your `.env` file:

```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=AKIA2MNVL5WH3SS3INGG
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1

# SNS Configuration
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:ClassRegistrationMFA
```

### Step 4: Test SNS Configuration

Run the test script:
```bash
cd BackEnd
node scripts/testMFA.js
```

You should see:
```
✓ SNS Configured: Yes (will send real emails)
```

### Step 5: How It Works

1. **User Registration**:
   - User registers with email: `user@example.com`
   - Backend calls `subscribeEmailToSNS(email)`
   - AWS SNS sends a **confirmation email** to the user
   - User must click the confirmation link in the email

2. **Email Confirmation** (Important!):
   - AWS sends: "AWS Notification - Subscription Confirmation"
   - User must click "Confirm subscription" link
   - Without confirmation, user won't receive MFA codes

3. **MFA Code Delivery**:
   - User logs in
   - Backend generates OTP and publishes to SNS topic
   - SNS sends email to all confirmed subscribers
   - User receives MFA code via email

---

## Option 3: SNS Email Sandbox (Testing)

If you're in the SNS sandbox (new AWS accounts), you need to verify email addresses:

### Verify Email Addresses:

1. **Go to SNS Console**: https://console.aws.amazon.com/sns/
2. **Click "Email addresses"** in the left sidebar (under "Mobile" section)
3. **Click "Verify a new email address"**
4. **Enter email**: `your-test-email@example.com`
5. **Check email**: AWS sends verification email
6. **Click verification link** in the email

### Request Production Access:

To send to any email address (not just verified ones):

1. Go to SNS Console
2. Click "Text messaging (SMS)" in left sidebar
3. Click "Request production access"
4. Fill out the form explaining your use case
5. Wait for AWS approval (usually 24-48 hours)

---

## Option 4: Alternative - AWS SES (Simple Email Service)

For production, you might want to use AWS SES instead of SNS for better email deliverability:

### Why SES?
- Better email deliverability
- More control over email content
- Lower cost for high volume
- HTML email support
- Better spam score

### Quick SES Setup:

1. **Go to SES Console**: https://console.aws.amazon.com/ses/
2. **Verify email address** (for testing)
3. **Request production access** (for real use)
4. **Update code** to use SES instead of SNS

**Note**: The current implementation uses SNS. If you want SES, let me know and I can update the code.

---

## Troubleshooting

### Issue: "SNS not configured" message

**Solution**: Check your `.env` file has all required variables:
```bash
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
SNS_TOPIC_ARN=arn:aws:sns:region:account:topic
```

### Issue: User not receiving MFA codes

**Possible causes**:
1. **Email not confirmed**: User must click confirmation link from AWS
2. **Spam folder**: Check spam/junk folder
3. **Wrong topic ARN**: Verify the ARN in `.env` is correct
4. **IAM permissions**: Ensure user has SNS publish permissions
5. **Sandbox mode**: Verify email addresses in SNS console

**Check logs**:
```bash
# Backend console will show:
MFA code sent via SNS to user@example.com. MessageId: abc-123
```

### Issue: "AccessDenied" error

**Solution**: Add SNS permissions to your IAM user:
```bash
# Test permissions
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:123456789012:ClassRegistrationMFA \
  --message "Test message"
```

### Issue: Emails going to spam

**Solutions**:
1. Use AWS SES instead of SNS
2. Set up SPF/DKIM records
3. Request production access
4. Use a verified domain

---

## Cost Estimation

### SNS Pricing (as of 2024):
- **Email**: $2.00 per 100,000 emails
- **First 1,000 emails/month**: FREE
- **SMS**: $0.00645 per SMS (US)

### Example costs:
- 1,000 users/month: **FREE**
- 10,000 users/month: **$0.18**
- 100,000 users/month: **$1.98**

Very affordable for most applications!

---

## Testing Checklist

- [ ] AWS credentials configured in `.env`
- [ ] SNS topic created
- [ ] Topic ARN added to `.env`
- [ ] IAM permissions configured
- [ ] Test script passes: `node scripts/testMFA.js`
- [ ] User can register
- [ ] User receives SNS confirmation email
- [ ] User confirms SNS subscription
- [ ] User can login and receive MFA code
- [ ] MFA code verification works

---

## Quick Start Commands

```bash
# 1. Test MFA utilities (no SNS needed)
cd BackEnd
node scripts/testMFA.js

# 2. Start backend server
npm run dev

# 3. Test endpoints (in another terminal)
./scripts/testMFAEndpoints.sh

# 4. Check backend logs for MFA codes
# Look for: "=== EMAIL VIA SNS ===" in console
```

---

## Production Recommendations

For production deployment:

1. ✅ **Use AWS SES** instead of SNS for better deliverability
2. ✅ **Request production access** to send to any email
3. ✅ **Set up SPF/DKIM** records for your domain
4. ✅ **Use a custom domain** (e.g., noreply@yourdomain.com)
5. ✅ **Monitor bounce rates** and unsubscribes
6. ✅ **Implement email templates** with HTML formatting
7. ✅ **Add unsubscribe links** (required by law)
8. ✅ **Set up CloudWatch alarms** for failed deliveries
9. ✅ **Use AWS Secrets Manager** for credentials
10. ✅ **Enable CloudTrail** for audit logging

---

## Need Help?

- **AWS SNS Documentation**: https://docs.aws.amazon.com/sns/
- **AWS SES Documentation**: https://docs.aws.amazon.com/ses/
- **IAM Permissions**: https://docs.aws.amazon.com/IAM/

---

## Summary

**For Development/Testing**: 
- Leave `SNS_TOPIC_ARN` empty
- MFA codes will log to console
- No AWS setup needed!

**For Production**:
- Create SNS topic
- Add topic ARN to `.env`
- Users must confirm SNS subscription
- Real emails will be sent

The system automatically handles both scenarios! 🎉
