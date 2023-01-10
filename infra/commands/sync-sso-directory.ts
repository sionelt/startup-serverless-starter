#!/usr/bin/env node
import {
  CreateGroupCommand,
  CreateGroupMembershipCommand,
  CreateUserCommand,
  DeleteGroupCommand,
  DeleteUserCommand,
  IdentitystoreClient,
  ListGroupMembershipsCommand,
  ListGroupsCommand,
  ListUsersCommand,
  UpdateUserCommand,
} from '@aws-sdk/client-identitystore'
import yargs from 'yargs'
import {InfraConfig, SsoGroup, SsoUser} from '../config'

/** Command Options */
const argv = yargs(process.argv)
  .option('identity-store-id', {
    type: 'string',
    describe: 'SSO/Identity Store ID',
  })
  .help()
  .parseSync()

const isClient = new IdentitystoreClient({})

type IdentiyStoreGroup = {
  groupId: string
  displayName: SsoGroup
}
type IdentityStoreUser = SsoUser & {userId: string}

/**
 * Sync SSO/Identity Center directory
 */
export async function syncSsoDirectory({identityStoreId}: typeof argv) {
  if (!identityStoreId) {
    throw new Error(`Argument '--identity-store-id' is required`)
  }

  const groups = await syncGroups(identityStoreId)
  const users = await syncUsers(identityStoreId)
  await syncUsersToGroups(identityStoreId, groups, users)
}

async function syncGroups(
  IdentityStoreId: string
): Promise<IdentiyStoreGroup[]> {
  const {Groups: existingGroups = []} = await isClient.send(
    new ListGroupsCommand({IdentityStoreId})
  )
  const groupList = Object.values(InfraConfig.sso.groups)

  // Remove groups not found
  await Promise.all(
    existingGroups
      .filter((eg) => groupList.some((name) => name !== eg.DisplayName))
      .map(async (eg) =>
        isClient.send(
          new DeleteGroupCommand({IdentityStoreId, GroupId: eg.GroupId})
        )
      )
  )

  // Create new groups
  return Promise.all(
    groupList.map(async (displayName) => {
      const matched = existingGroups.find((g) => g.DisplayName == displayName)
      let groupId = matched?.GroupId

      if (!groupId) {
        const res = await isClient.send(
          new CreateGroupCommand({
            IdentityStoreId,
            DisplayName: displayName,
            Description: `${displayName} group`,
          })
        )
        if (!res.GroupId) {
          throw new Error(
            `Failed to create IdentityStore group '${displayName}'`
          )
        }
        groupId = res.GroupId
      }

      return {groupId, displayName}
    })
  )
}

async function syncUsers(
  IdentityStoreId: string
): Promise<IdentityStoreUser[]> {
  const {Users: existingUsers = []} = await isClient.send(
    new ListUsersCommand({IdentityStoreId})
  )

  // Remove users not found
  await Promise.all(
    existingUsers
      .filter((eu) =>
        InfraConfig.sso.users.all.some((u) => u.username !== eu.UserName)
      )
      .map(async (eu) =>
        isClient.send(
          new DeleteUserCommand({IdentityStoreId, UserId: eu.UserId})
        )
      )
  )

  // Updated/Create users
  return Promise.all(
    InfraConfig.sso.users.all.map(async (u) => {
      const matched = existingUsers.find((eu) => eu.UserName === u.username)
      let userId = matched?.UserId

      if (userId) {
        await isClient.send(
          new UpdateUserCommand({
            IdentityStoreId,
            UserId: userId,
            Operations: [
              {
                AttributePath: 'Emails',
                AttributeValue: [{Value: u.email, Primary: true, Type: 'work'}],
              },
            ],
          })
        )
      } else {
        const res = await isClient.send(
          new CreateUserCommand({
            IdentityStoreId,
            UserName: u.username,
            DisplayName: u.givenName,
            Name: {GivenName: u.givenName, FamilyName: u.familyName},
            Emails: [{Value: u.email, Primary: true, Type: 'work'}],
          })
        )
        if (!res.UserId) {
          throw new Error(`Failed to create IdentityStore user '${u.username}'`)
        }
        userId = res.UserId
      }

      return {userId, ...u}
    })
  )
}

async function syncUsersToGroups(
  IdentityStoreId: string,
  groups: IdentiyStoreGroup[],
  users: IdentityStoreUser[]
) {
  groups.map(async (group) => {
    await Promise.all(
      InfraConfig.sso.users[group.displayName].map(async (user) => {
        const {GroupMemberships: existingMembers = []} = await isClient.send(
          new ListGroupMembershipsCommand({
            IdentityStoreId,
            GroupId: group.groupId,
          })
        )
        const matchedUser = users.find((u) => u.username === user.username)
        if (!matchedUser) throw new Error(`User '${user.username}' not found`)

        const matchedMember = existingMembers.find(
          (m) => m.MemberId?.UserId === matchedUser.userId
        )
        let membershipId = matchedMember?.MembershipId

        if (!membershipId) {
          const res = await isClient.send(
            new CreateGroupMembershipCommand({
              IdentityStoreId,
              GroupId: group.groupId,
              MemberId: {UserId: matchedUser.userId},
            })
          )
          if (!res.MembershipId) {
            throw new Error(
              `Failed to add IdentityStore member '${user.username}' in group '${group.displayName}'`
            )
          }
          membershipId = res.MembershipId
        }
      })
    )
  })
}
