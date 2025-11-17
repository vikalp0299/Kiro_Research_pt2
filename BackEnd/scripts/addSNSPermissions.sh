#!/bin/bash

# Add SNS Publish permissions to IAM user
# This script creates and attaches an inline policy to allow SNS:Publish

echo "============================================================"
echo "🔐 Adding SNS Permissions to IAM User"
echo "============================================================"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed"
    exit 1
fi

# Get current IAM user
CURRENT_USER=$(aws sts get-caller-identity --query Arn --output text 2>&1)
if [ $? -ne 0 ]; then
    echo "❌ Failed to get AWS credentials"
    echo "$CURRENT_USER"
    exit 1
fi

USER_NAME=$(echo $CURRENT_USER | cut -d'/' -f2)
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "Current IAM User: $USER_NAME"
echo "Account ID: $ACCOUNT_ID"
echo ""

# Get region
read -p "Enter AWS region [us-east-1]: " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

# SNS Topic ARN
TOPIC_ARN="arn:aws:sns:${AWS_REGION}:${ACCOUNT_ID}:ClassRegistrationMFA"
echo "SNS Topic ARN: $TOPIC_ARN"
echo ""

# Create policy document
POLICY_NAME="ClassRegistrationMFASNSPublish"
POLICY_DOCUMENT=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "$TOPIC_ARN"
    }
  ]
}
EOF
)

echo "Creating inline policy: $POLICY_NAME"
echo ""

# Attach inline policy to user
aws iam put-user-policy \
    --user-name "$USER_NAME" \
    --policy-name "$POLICY_NAME" \
    --policy-document "$POLICY_DOCUMENT"

if [ $? -eq 0 ]; then
    echo "✅ Successfully added SNS:Publish permission!"
    echo ""
    echo "Policy Details:"
    echo "  Policy Name: $POLICY_NAME"
    echo "  User: $USER_NAME"
    echo "  Permission: SNS:Publish"
    echo "  Resource: $TOPIC_ARN"
    echo ""
    echo "Next Steps:"
    echo "  1. Restart your backend server"
    echo "  2. Try logging in again"
    echo "  3. You should receive MFA codes via email"
    echo ""
else
    echo "❌ Failed to add policy"
    echo ""
    echo "Manual Steps:"
    echo "  1. Go to AWS IAM Console"
    echo "  2. Find user: $USER_NAME"
    echo "  3. Add inline policy with this JSON:"
    echo ""
    echo "$POLICY_DOCUMENT"
    echo ""
fi

echo "============================================================"
