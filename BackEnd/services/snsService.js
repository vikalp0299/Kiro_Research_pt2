/**
 * AWS SNS Service
 * Handles email subscriptions and message delivery via AWS SNS
 */

const { SNSClient, SubscribeCommand, PublishCommand, UnsubscribeCommand } = require('@aws-sdk/client-sns');

// Initialize SNS client
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

/**
 * Check if SNS is configured
 * @returns {boolean} True if SNS credentials are available
 */
function isSNSConfigured() {
  return !!(process.env.AWS_ACCESS_KEY_ID && 
            process.env.AWS_SECRET_ACCESS_KEY && 
            process.env.SNS_TOPIC_ARN);
}

/**
 * Subscribe an email to SNS topic for receiving notifications
 * @param {string} email - Email address to subscribe
 * @returns {Promise<Object>} Subscription result
 */
async function subscribeEmailToSNS(email) {
  try {
    if (!isSNSConfigured()) {
      console.log(`SNS not configured - would subscribe: ${email}`);
      return {
        success: true,
        message: 'SNS not configured (development mode)',
        subscribed: false
      };
    }

    const params = {
      Protocol: 'email',
      TopicArn: process.env.SNS_TOPIC_ARN,
      Endpoint: email,
      ReturnSubscriptionArn: true
    };

    const command = new SubscribeCommand(params);
    const response = await snsClient.send(command);

    console.log(`Email ${email} subscribed to SNS. SubscriptionArn: ${response.SubscriptionArn}`);

    return {
      success: true,
      message: 'Email subscribed successfully. Please check your email to confirm subscription.',
      subscriptionArn: response.SubscriptionArn,
      subscribed: true,
      requiresConfirmation: response.SubscriptionArn === 'pending confirmation'
    };

  } catch (error) {
    console.error('Error subscribing email to SNS:', error);
    
    // Don't fail registration if SNS subscription fails
    return {
      success: false,
      message: 'Email subscription failed, but registration completed',
      error: error.message,
      subscribed: false
    };
  }
}

/**
 * Unsubscribe an email from SNS topic
 * @param {string} subscriptionArn - Subscription ARN to unsubscribe
 * @returns {Promise<Object>} Unsubscribe result
 */
async function unsubscribeEmailFromSNS(subscriptionArn) {
  try {
    if (!isSNSConfigured()) {
      return {
        success: true,
        message: 'SNS not configured (development mode)'
      };
    }

    const params = {
      SubscriptionArn: subscriptionArn
    };

    const command = new UnsubscribeCommand(params);
    await snsClient.send(command);

    console.log(`Unsubscribed from SNS: ${subscriptionArn}`);

    return {
      success: true,
      message: 'Email unsubscribed successfully'
    };

  } catch (error) {
    console.error('Error unsubscribing from SNS:', error);
    return {
      success: false,
      message: 'Unsubscribe failed',
      error: error.message
    };
  }
}

/**
 * Send email via SNS to a specific email address
 * @param {string} email - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} message - Email message body
 * @returns {Promise<Object>} Send result
 */
async function sendEmailViaSNS(email, subject, message) {
  try {
    if (!isSNSConfigured()) {
      // Fallback to console logging in development
      console.log('\n=== EMAIL VIA SNS (Console Mode) ===');
      console.log(`To: ${email}`);
      console.log(`Subject: ${subject}`);
      console.log(`\n${message}`);
      console.log('====================================\n');
      
      return {
        success: true,
        message: 'Email logged to console (SNS not configured)',
        mode: 'console'
      };
    }

    // Publish to topic with email filter
    const params = {
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: subject,
      Message: message,
      MessageAttributes: {
        email: {
          DataType: 'String',
          StringValue: email
        }
      }
    };

    const command = new PublishCommand(params);
    const response = await snsClient.send(command);

    console.log(`Email sent via SNS to ${email}. MessageId: ${response.MessageId}`);

    return {
      success: true,
      message: 'Email sent successfully',
      messageId: response.MessageId,
      mode: 'sns'
    };

  } catch (error) {
    console.error('Error sending email via SNS:', error);
    
    // Fallback to console logging if SNS fails
    console.log('\n=== EMAIL VIA SNS (Fallback - Error) ===');
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
    console.log(`Error: ${error.message}`);
    console.log('========================================\n');
    
    return {
      success: true,
      message: 'Email logged to console (SNS error)',
      error: error.message,
      mode: 'console-fallback'
    };
  }
}

/**
 * Send SMS via SNS to a phone number
 * @param {string} phoneNumber - Phone number in E.164 format (+1234567890)
 * @param {string} message - SMS message
 * @returns {Promise<Object>} Send result
 */
async function sendSMSViaSNS(phoneNumber, message) {
  try {
    if (!isSNSConfigured()) {
      console.log('\n=== SMS VIA SNS (Console Mode) ===');
      console.log(`To: ${phoneNumber}`);
      console.log(`Message: ${message}`);
      console.log('===================================\n');
      
      return {
        success: true,
        message: 'SMS logged to console (SNS not configured)',
        mode: 'console'
      };
    }

    const params = {
      PhoneNumber: phoneNumber,
      Message: message,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional'
        }
      }
    };

    const command = new PublishCommand(params);
    const response = await snsClient.send(command);

    console.log(`SMS sent via SNS to ${phoneNumber}. MessageId: ${response.MessageId}`);

    return {
      success: true,
      message: 'SMS sent successfully',
      messageId: response.MessageId,
      mode: 'sns'
    };

  } catch (error) {
    console.error('Error sending SMS via SNS:', error);
    
    console.log('\n=== SMS VIA SNS (Fallback - Error) ===');
    console.log(`To: ${phoneNumber}`);
    console.log(`Message: ${message}`);
    console.log(`Error: ${error.message}`);
    console.log('=======================================\n');
    
    return {
      success: true,
      message: 'SMS logged to console (SNS error)',
      error: error.message,
      mode: 'console-fallback'
    };
  }
}

module.exports = {
  isSNSConfigured,
  subscribeEmailToSNS,
  unsubscribeEmailFromSNS,
  sendEmailViaSNS,
  sendSMSViaSNS
};
