---
inclusion: always
---

# AWS DynamoDB Development Guidelines

## Client Initialization
- Always use `@aws-sdk/client-dynamodb` for low-level operations
- Use `@aws-sdk/lib-dynamodb` (DynamoDBDocumentClient) for simplified operations with native JavaScript types
- Initialize client with proper region configuration
- Store AWS credentials in environment variables, never hardcode

## Table Operations
- Check if tables exist before creating them
- Handle `ResourceInUseException` gracefully when tables already exist
- Use proper AttributeDefinitions and KeySchema for table creation
- Define GlobalSecondaryIndexes when needed for query optimization
- Use BillingMode: "PROVISIONED" or "PAY_PER_REQUEST" based on requirements

## Item Operations
- Use DynamoDBDocumentClient for cleaner code with native types
- Configure marshallOptions:
  - `convertEmptyValues: true` - Handle empty strings/sets
  - `removeUndefinedValues: true` - Remove undefined properties
  - `convertClassInstanceToMap: true` - Convert class instances
- Use proper attribute types: S (String), N (Number), BOOL (Boolean), SS (String Set), M (Map)

## Query Best Practices
- Use KeyConditionExpression for partition and sort key queries
- Use FilterExpression for additional filtering (applied after query)
- Use ExpressionAttributeNames for reserved keywords (e.g., #status, #name)
- Use ExpressionAttributeValues for parameterized values
- Implement pagination with Limit parameter

## Update Operations
- Use UpdateExpression with SET, ADD, REMOVE, DELETE operations
- Use ConditionExpression to ensure item exists before update
- Use ReturnValues: "ALL_NEW" to get updated item
- Handle conditional check failures gracefully

## Error Handling
- Always wrap DynamoDB operations in try-catch blocks
- Check for specific error names (ResourceInUseException, ConditionalCheckFailedException)
- Log error metadata (requestId) for debugging
- Implement proper cleanup with client.destroy()

## Security
- Never expose AWS credentials in code
- Use IAM roles with least privilege
- Enable encryption at rest
- Use VPC endpoints for private access
