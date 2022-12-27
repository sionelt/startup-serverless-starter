# AWS Bootstrap

Bootstrap a new AWS Account with necessary infrastuctures.

1. Create AWS Organization
2. Enable AWS SSO
3. Run command `pnpm sync-sso-directory` to create SSO groups & users
4. Run Github Actions `aws-bootstrap` workflow with
   1. stage `root`
   2. stage `account`
   3. stage `region`
      - us-west-2
      - us-east-1
