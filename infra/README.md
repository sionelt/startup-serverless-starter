# AWS Bootstrap

Bootstrap AWS Organization & Accounts with necessary infrastuctures.

1. Login to root account
2. Create AWS Organization
3. Enable AWS SSO
4. Run command `pnpm sync-sso-directory` to create SSO groups & users
5. Run Github Actions `aws-bootstrap` workflow with:
   1. stage `organization` in:
      - us-west-2
   2. stage `account` in:
      - us-west-2
   3. stage `region` in:
      - us-west-2
   4. stage `cdn` in:
      - us-east-1
