#!/usr/bin/env python3
"""
Environment Configuration Setup Script
Interactively collects environment variables and creates .env file
"""

import os
import secrets
import re
from pathlib import Path


def generate_jwt_secret():
    """Generate a secure 256-bit random secret for JWT"""
    return secrets.token_hex(32)  # 32 bytes = 256 bits


def validate_email(email):
    """Basic email validation"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_port(port):
    """Validate port number"""
    try:
        port_num = int(port)
        return 1 <= port_num <= 65535
    except ValueError:
        return False


def validate_url(url):
    """Basic URL validation"""
    pattern = r'^https?://[^\s]+$'
    return re.match(pattern, url) is not None


def get_input(prompt, default=None, validator=None, secret=False):
    """Get user input with optional validation"""
    while True:
        if default:
            user_input = input(f"{prompt} [{default}]: ").strip()
            if not user_input:
                user_input = default
        else:
            user_input = input(f"{prompt}: ").strip()
        
        if validator and not validator(user_input):
            print("❌ Invalid input. Please try again.")
            continue
        
        return user_input


def get_yes_no(prompt, default='y'):
    """Get yes/no input from user"""
    while True:
        response = input(f"{prompt} [{'Y/n' if default == 'y' else 'y/N'}]: ").strip().lower()
        if not response:
            response = default
        if response in ['y', 'yes']:
            return True
        elif response in ['n', 'no']:
            return False
        print("❌ Please enter 'y' or 'n'")


def main():
    print("=" * 60)
    print("Class Registration App - Environment Configuration Setup")
    print("=" * 60)
    print()
    
    # Check if .env already exists
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        print("⚠️  Warning: .env file already exists!")
        if not get_yes_no("Do you want to overwrite it?", default='n'):
            print("❌ Setup cancelled.")
            return
        print()
    
    config = {}
    
    # JWT Configuration
    print("📝 JWT Configuration")
    print("-" * 60)
    
    if get_yes_no("Generate a secure JWT secret automatically?", default='y'):
        config['JWT_SECRET'] = generate_jwt_secret()
        print(f"✅ Generated JWT secret: {config['JWT_SECRET'][:16]}...")
    else:
        config['JWT_SECRET'] = get_input(
            "Enter JWT secret (minimum 32 characters)",
            validator=lambda x: len(x) >= 32
        )
    
    config['JWT_EXPIRES_IN'] = get_input(
        "JWT access token expiration",
        default='30m'
    )
    
    config['JWT_REFRESH_EXPIRES_IN'] = get_input(
        "JWT refresh token expiration",
        default='7d'
    )
    
    config['JWT_ISSUER'] = get_input(
        "JWT issuer",
        default='class-registration-app'
    )
    
    config['JWT_AUDIENCE'] = get_input(
        "JWT audience",
        default='class-registration-users'
    )
    print()
    
    # AWS Configuration
    print("☁️  AWS Configuration")
    print("-" * 60)
    
    config['AWS_ACCESS_KEY_ID'] = get_input(
        "AWS Access Key ID"
    )
    
    config['AWS_SECRET_ACCESS_KEY'] = get_input(
        "AWS Secret Access Key"
    )
    
    config['AWS_REGION'] = get_input(
        "AWS Region",
        default='us-east-1'
    )
    print()
    
    # Application Configuration
    print("⚙️  Application Configuration")
    print("-" * 60)
    
    config['NODE_ENV'] = get_input(
        "Node environment (development/production)",
        default='development',
        validator=lambda x: x in ['development', 'production', 'test']
    )
    
    config['PORT'] = get_input(
        "Server port",
        default='3000',
        validator=validate_port
    )
    
    config['FRONTEND_URL'] = get_input(
        "Frontend URL",
        default='http://localhost:3001',
        validator=validate_url
    )
    print()
    
    # Security Configuration
    print("🔒 Security Configuration")
    print("-" * 60)
    
    config['BCRYPT_SALT_ROUNDS'] = get_input(
        "Bcrypt salt rounds (recommended: 14)",
        default='14',
        validator=lambda x: x.isdigit() and 10 <= int(x) <= 20
    )
    
    config['RATE_LIMIT_WINDOW_MS'] = get_input(
        "Rate limit window in milliseconds",
        default='900000',
        validator=lambda x: x.isdigit()
    )
    
    config['RATE_LIMIT_MAX_REQUESTS'] = get_input(
        "Maximum requests per window",
        default='100',
        validator=lambda x: x.isdigit()
    )
    
    config['AUTH_RATE_LIMIT_MAX'] = get_input(
        "Maximum auth attempts per window",
        default='5',
        validator=lambda x: x.isdigit()
    )
    print()
    
    # CORS Configuration
    print("🌐 CORS Configuration")
    print("-" * 60)
    
    config['ALLOWED_ORIGINS'] = get_input(
        "Allowed origins (comma-separated)",
        default='http://localhost:3001,http://localhost:3000'
    )
    print()
    
    # Database Configuration
    print("💾 Database Configuration")
    print("-" * 60)
    
    if get_yes_no("Use local DynamoDB endpoint?", default='n'):
        config['DYNAMODB_ENDPOINT'] = get_input(
            "DynamoDB endpoint URL",
            default='http://localhost:8000',
            validator=validate_url
        )
    else:
        config['DYNAMODB_ENDPOINT'] = ''
    print()
    
    # Write .env file
    print("💾 Writing .env file...")
    try:
        with open(env_path, 'w') as f:
            f.write("# JWT Configuration\n")
            f.write(f"JWT_SECRET={config['JWT_SECRET']}\n")
            f.write(f"JWT_EXPIRES_IN={config['JWT_EXPIRES_IN']}\n")
            f.write(f"JWT_REFRESH_EXPIRES_IN={config['JWT_REFRESH_EXPIRES_IN']}\n")
            f.write(f"JWT_ISSUER={config['JWT_ISSUER']}\n")
            f.write(f"JWT_AUDIENCE={config['JWT_AUDIENCE']}\n")
            f.write("\n")
            
            f.write("# AWS Configuration\n")
            f.write(f"AWS_ACCESS_KEY_ID={config['AWS_ACCESS_KEY_ID']}\n")
            f.write(f"AWS_SECRET_ACCESS_KEY={config['AWS_SECRET_ACCESS_KEY']}\n")
            f.write(f"AWS_REGION={config['AWS_REGION']}\n")
            f.write("\n")
            
            f.write("# Application Configuration\n")
            f.write(f"NODE_ENV={config['NODE_ENV']}\n")
            f.write(f"PORT={config['PORT']}\n")
            f.write(f"FRONTEND_URL={config['FRONTEND_URL']}\n")
            f.write("\n")
            
            f.write("# Security Configuration\n")
            f.write(f"BCRYPT_SALT_ROUNDS={config['BCRYPT_SALT_ROUNDS']}\n")
            f.write(f"RATE_LIMIT_WINDOW_MS={config['RATE_LIMIT_WINDOW_MS']}\n")
            f.write(f"RATE_LIMIT_MAX_REQUESTS={config['RATE_LIMIT_MAX_REQUESTS']}\n")
            f.write(f"AUTH_RATE_LIMIT_MAX={config['AUTH_RATE_LIMIT_MAX']}\n")
            f.write("\n")
            
            f.write("# CORS Configuration\n")
            f.write(f"ALLOWED_ORIGINS={config['ALLOWED_ORIGINS']}\n")
            f.write("\n")
            
            if config['DYNAMODB_ENDPOINT']:
                f.write("# Database Configuration\n")
                f.write(f"DYNAMODB_ENDPOINT={config['DYNAMODB_ENDPOINT']}\n")
                f.write("\n")
        
        print("✅ .env file created successfully!")
        print(f"📁 Location: {env_path.absolute()}")
        print()
        print("⚠️  Important: Never commit the .env file to version control!")
        print("✅ Make sure .env is listed in your .gitignore file")
        
    except Exception as e:
        print(f"❌ Error writing .env file: {e}")
        return 1
    
    return 0


if __name__ == '__main__':
    exit(main())
