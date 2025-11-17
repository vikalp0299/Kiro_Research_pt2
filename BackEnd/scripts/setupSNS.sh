#!/bin/bash

# AWS SNS Setup Script
# Automatically creates SNS topic and updates .env file

echo "============================================================"
echo "🚀 AWS SNS Setup for MFA"
echo "============================================================"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed"
    echo ""
    echo "Install AWS CLI:"
    echo "  macOS: brew install awscli"
    echo "  Linux: sudo apt-get install awscli"
    echo "  Windows: https://aws.amazon.com/cli/"
    echo ""
    exit 1
fi

echo "✓ AWS CLI is installed"
echo ""

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    echo ""
    echo "Configure AWS credentials:"
    echo "  aws configure"
    echo ""
    echo "You'll need:"
    echo "  - AWS Access Key ID"
    echo "  - AWS Secret Access Key"
    echo "  - Default region (e.g., us-east-1)"
    echo ""
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✓ AWS credentials configured"
echo "  Account ID: $ACCOUNT_ID"
echo ""

# Get region
read -p "Enter AWS region [us-east-1]: " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}
echo "  Using region: $AWS_REGION"
echo ""

# Create SNS topic
echo "Creating SNS topic..."
TOPIC_NAME="ClassRegistrationMFA"

TOPIC_ARN=$(aws sns create-topic \
    --name $TOPIC_NAME \
    --region $AWS_REGION \
    --query TopicArn \
    --output text 2>&1)

if [ $? -eq 0 ]; then
    echo "✓ SNS topic created successfully"
    echo "  Topic ARN: $TOPIC_ARN"
else
    # Check if topic already exists
    TOPIC_ARN=$(aws sns list-topics \
        --region $AWS_REGION \
        --query "Topics[?contains(TopicArn, '$TOPIC_NAME')].TopicArn" \
        --output text)
    
    if [ -n "$TOPIC_ARN" ]; then
        echo "✓ SNS topic already exists"
        echo "  Topic ARN: $TOPIC_ARN"
    else
        echo "❌ Failed to create SNS topic"
        echo "$TOPIC_ARN"
        exit 1
    fi
fi
echo ""

# Update .env file
echo "Updating .env file..."
ENV_FILE="../.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env file not found at $ENV_FILE"
    exit 1
fi

# Check if SNS_TOPIC_ARN already exists in .env
if grep -q "^SNS_TOPIC_ARN=" "$ENV_FILE"; then
    # Update existing line
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|^SNS_TOPIC_ARN=.*|SNS_TOPIC_ARN=$TOPIC_ARN|" "$ENV_FILE"
    else
        # Linux
        sed -i "s|^SNS_TOPIC_ARN=.*|SNS_TOPIC_ARN=$TOPIC_ARN|" "$ENV_FILE"
    fi
    echo "✓ Updated SNS_TOPIC_ARN in .env"
else
    # Add new line
    echo "" >> "$ENV_FILE"
    echo "# AWS SNS Topic ARN (auto-configured)" >> "$ENV_FILE"
    echo "SNS_TOPIC_ARN=$TOPIC_ARN" >> "$ENV_FILE"
    echo "✓ Added SNS_TOPIC_ARN to .env"
fi
echo ""

# Test SNS
echo "Testing SNS configuration..."
TEST_MESSAGE="Test message from Class Registration App setup"

aws sns publish \
    --topic-arn "$TOPIC_ARN" \
    --subject "Test - Class Registration App" \
    --message "$TEST_MESSAGE" \
    --region $AWS_REGION \
    > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✓ SNS publish test successful"
else
    echo "⚠️  SNS publish test failed (this is normal if no subscribers yet)"
fi
echo ""

# Summary
echo "============================================================"
echo "✅ SNS Setup Complete!"
echo "============================================================"
echo ""
echo "Configuration:"
echo "  Topic Name: $TOPIC_NAME"
echo "  Topic ARN: $TOPIC_ARN"
echo "  Region: $AWS_REGION"
echo ""
echo "Next Steps:"
echo ""
echo "1. Restart your backend server:"
echo "   cd BackEnd && npm run dev"
echo ""
echo "2. Register a new user:"
echo "   The user will receive an SNS confirmation email"
echo ""
echo "3. User must confirm subscription:"
echo "   Click the link in the AWS confirmation email"
echo ""
echo "4. Login to test MFA:"
echo "   User will receive MFA code via email"
echo ""
echo "Important Notes:"
echo "  • Users MUST confirm SNS subscription to receive emails"
echo "  • Check spam folder for AWS emails"
echo "  • First 1,000 emails/month are FREE"
echo "  • For production, request SNS production access"
echo ""
echo "Troubleshooting:"
echo "  • Run: node scripts/testMFA.js"
echo "  • Check: BackEnd/SNS_SETUP_GUIDE.md"
echo ""
echo "============================================================"
echo ""
