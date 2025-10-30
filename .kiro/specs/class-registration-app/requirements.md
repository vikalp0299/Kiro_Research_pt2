# Requirements Document

## Introduction

A comprehensive class registration application that enables students to register for courses, manage their enrollments, and view class information. The system consists of three main components: a database layer using AWS DynamoDB, a backend API built with Express.js, and a frontend interface using React/Next.js.

## Glossary

- **Class Registration System**: The complete application enabling student course registration
- **Student User Database (studentUserDB)**: DynamoDB table storing student account information
- **Class Database (classDB)**: DynamoDB table containing course catalog information
- **Class Registration Database (classRegistrationDB)**: DynamoDB table tracking student enrollments
- **JWT Token**: JSON Web Token used for user authentication and session management
- **Registration Status**: Enrollment state that can be "enrolled" or "dropped"

## Requirements

### Requirement 1

**User Story:** As a student, I want to create an account with my personal information, so that I can access the class registration system

#### Acceptance Criteria

1. WHEN a student provides username, full name, email, and password, THE Class Registration System SHALL create a new user account with encrypted password
2. IF a username or email already exists in studentUserDB, THEN THE Class Registration System SHALL return an error message
3. THE Class Registration System SHALL generate a unique 10-digit user ID for each new account
4. THE Class Registration System SHALL encrypt passwords using bcrypt before storage
5. WHEN account creation is successful, THE Class Registration System SHALL generate and return a JWT token

### Requirement 2

**User Story:** As a student, I want to log into my account using my credentials, so that I can access my personalized class information

#### Acceptance Criteria

1. WHEN a student provides username or email and password, THE Class Registration System SHALL authenticate the credentials
2. IF credentials are invalid, THEN THE Class Registration System SHALL return an authentication error
3. WHEN authentication is successful, THE Class Registration System SHALL generate and return a JWT token
4. THE Class Registration System SHALL verify user existence in studentUserDB before password comparison

### Requirement 3

**User Story:** As a student, I want to view all available classes, so that I can choose which courses to register for

#### Acceptance Criteria

1. WHEN a student requests available classes, THE Class Registration System SHALL return all classes not currently enrolled by that student
2. THE Class Registration System SHALL display class ID, class name, credits, and description for each available class
3. THE Class Registration System SHALL exclude classes where the student has "enrolled" status in classRegistrationDB
4. THE Class Registration System SHALL require valid JWT token authentication for this operation

### Requirement 4

**User Story:** As a student, I want to register for available classes, so that I can enroll in courses I need

#### Acceptance Criteria

1. WHEN a student selects a class to register, THE Class Registration System SHALL create an enrollment record with "enrolled" status
2. IF a student is already enrolled in the class, THEN THE Class Registration System SHALL return an error message
3. IF a student previously dropped the class, THE Class Registration System SHALL update the existing record to "enrolled" status
4. THE Class Registration System SHALL require valid JWT token authentication for registration operations

### Requirement 5

**User Story:** As a student, I want to view my enrolled classes, so that I can see my current course schedule

#### Acceptance Criteria

1. WHEN a student requests enrolled classes, THE Class Registration System SHALL return all classes with "enrolled" status for that student
2. THE Class Registration System SHALL display class ID and class name for each enrolled class
3. IF no classes are enrolled, THE Class Registration System SHALL return an appropriate message
4. THE Class Registration System SHALL require valid JWT token authentication for this operation

### Requirement 6

**User Story:** As a student, I want to drop classes I'm enrolled in, so that I can remove courses from my schedule

#### Acceptance Criteria

1. WHEN a student requests to drop an enrolled class, THE Class Registration System SHALL update the registration status to "dropped"
2. IF a student is not enrolled in the class, THEN THE Class Registration System SHALL return an error message
3. THE Class Registration System SHALL maintain the registration record with updated status rather than deleting it
4. THE Class Registration System SHALL require valid JWT token authentication for drop operations

### Requirement 7

**User Story:** As a student, I want to view classes I have dropped, so that I can see my registration history and potentially re-enroll

#### Acceptance Criteria

1. WHEN a student requests dropped classes, THE Class Registration System SHALL return all classes with "dropped" status for that student
2. THE Class Registration System SHALL display class ID and class name for each dropped class
3. IF no classes are dropped, THE Class Registration System SHALL return an appropriate message
4. THE Class Registration System SHALL allow re-enrollment from the dropped classes list

### Requirement 8

**User Story:** As a system administrator, I want the database to be automatically initialized with sample data, so that the application has courses available for testing

#### Acceptance Criteria

1. WHEN the system starts, THE Class Registration System SHALL create three DynamoDB tables if they do not exist
2. THE Class Registration System SHALL populate classDB with 5-10 sample courses upon initial creation
3. THE Class Registration System SHALL generate class IDs with prefixes IFT, CSE, CCE, or EEE followed by 3-digit numbers
4. THE Class Registration System SHALL assign credits of either 3 or 4 to each course
5. THE Class Registration System SHALL generate appropriate class names and descriptions for sample data

### Requirement 9

**User Story:** As a student, I want secure password requirements enforced, so that my account is protected

#### Acceptance Criteria

1. THE Class Registration System SHALL require passwords to be minimum 10 characters long
2. THE Class Registration System SHALL require passwords to contain numbers, alphabets, special characters, uppercase and lowercase letters
3. THE Class Registration System SHALL provide real-time password strength feedback during registration
4. THE Class Registration System SHALL validate email format during account creation

### Requirement 10

**User Story:** As a student, I want to securely log out of my account, so that my session is properly terminated

#### Acceptance Criteria

1. WHEN a student logs out, THE Class Registration System SHALL invalidate the current JWT token
2. THE Class Registration System SHALL redirect the user to the login page after logout
3. THE Class Registration System SHALL clear any stored authentication tokens from the browser

### Requirement 11

**User Story:** As a system administrator, I want the application to use only AWS free tier resources, so that there are no unexpected costs during development and testing

#### Acceptance Criteria

1. THE Class Registration System SHALL use only AWS DynamoDB free tier limits (25 GB storage, 25 read/write capacity units)
2. THE Class Registration System SHALL configure DynamoDB tables with on-demand billing to avoid provisioned capacity charges
3. THE Class Registration System SHALL implement efficient queries to minimize read/write operations
4. THE Class Registration System SHALL not exceed AWS free tier usage limits for any services used