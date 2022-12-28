# AWS Bootstrap

Bootstrap a new AWS Account with necessary infrastuctures.

1. Create AWS Organization
2. Enable AWS SSO
3. Run command `pnpm sync-sso-directory` to create SSO groups & users
4. Run Github Actions `aws-bootstrap` workflow with
   1. stage `organization` in
      - us-west-2
   2. stage `account` in
      - us-west-2
   3. stage `region` in:
      - us-west-2
      - us-east-2
   4. stage `cdn` in:
      - us-east-1
