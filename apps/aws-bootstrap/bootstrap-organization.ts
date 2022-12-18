import {
  CreateGroupCommand,
  CreateGroupMembershipCommand,
  CreateUserCommand,
  DeleteUserCommand,
  IdentitystoreClient,
  ListGroupMembershipsCommand,
  ListGroupsCommand,
  ListUsersCommand,
  UpdateUserCommand,
} from '@aws-sdk/client-identitystore'
import {
  CreateOrganizationCommand,
  DescribeOrganizationCommand,
  OrganizationFeatureSet,
  OrganizationsClient,
} from '@aws-sdk/client-organizations'
import {partition, some} from 'lodash-es'
import {AwsConfig, SsoGroup, SsoUser} from '../../aws.config'

type IdentiyStoreGroup = {
  id: string
  displayName: SsoGroup
}
type IdentityStoreUser = SsoUser & {id: string}

const orgClient = new OrganizationsClient({})
const isClient = new IdentitystoreClient({})

export async function bootstrap() {
  await createOrganization()
  const identityStoreId = await enableIdentityStore()
  const groups = await createIdentityStoreGroups(identityStoreId)
  const users = await syncIdentityStoreUsers(identityStoreId)
  await addIdentityStoreUsersToGroup(identityStoreId, groups, users)
}

async function createOrganization() {
  const {Organization} = await orgClient.send(
    new DescribeOrganizationCommand({})
  )
  if (Organization) return Organization

  const res = await orgClient.send(
    new CreateOrganizationCommand({
      FeatureSet: OrganizationFeatureSet.ALL,
    })
  )
  return res.Organization
}

async function enableIdentityStore() {
  return ''
}

async function createIdentityStoreGroups(
  IdentityStoreId: string
): Promise<IdentiyStoreGroup[]> {
  const {Groups: existingGroups = []} = await isClient.send(
    new ListGroupsCommand({IdentityStoreId})
  )

  return Promise.all(
    AwsConfig.sso.groups.map(async (displayName) => {
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
        if (!res.GroupId)
          throw new Error(
            `Failed to create IdentityStore group for ${displayName}`
          )
        groupId = res.GroupId
      }

      return {id: groupId, displayName}
    })
  )
}

async function syncIdentityStoreUsers(
  IdentityStoreId: string
): Promise<IdentityStoreUser[]> {
  const {Users: existingUsers = []} = await isClient.send(
    new ListUsersCommand({IdentityStoreId})
  )

  // Remove users
  await Promise.all(
    existingUsers
      .filter((eu) =>
        AwsConfig.sso.users.all.some((u) => u.username !== eu.UserName)
      )
      .map(async (eu) =>
        isClient.send(
          new DeleteUserCommand({IdentityStoreId, UserId: eu.UserId})
        )
      )
  )

  // Updated/Create users
  return Promise.all(
    AwsConfig.sso.users.all.map(async (u) => {
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
              {AttributePath: 'DisplayName', AttributeValue: u.givenName},
              {
                AttributePath: 'Name',
                AttributeValue: {
                  GivenName: u.givenName,
                  FamilyName: u.familyName,
                },
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
        if (!res.UserId)
          throw new Error(`Failed to create IdentityStore user ${u.username}`)
        userId = res.UserId
      }

      return {id: userId, ...u}
    })
  )
}

async function addIdentityStoreUsersToGroup(
  IdentityStoreId: string,
  groups: IdentiyStoreGroup[],
  users: IdentityStoreUser[]
) {
  groups.map(async (group) => {
    await Promise.all(
      AwsConfig.sso.users[group.displayName].map(async (user) => {
        const {GroupMemberships: existingMembers = []} = await isClient.send(
          new ListGroupMembershipsCommand({
            IdentityStoreId,
            GroupId: group.id,
          })
        )
        const matchedUser = users.find((u) => u.username === user.username)
        if (!matchedUser) throw new Error(`User ${user.username} not found`)

        const matchedMember = existingMembers.find(
          (m) => m.MemberId?.UserId === matchedUser.id
        )
        let membershipId = matchedMember?.MembershipId

        if (!membershipId) {
          const res = await isClient.send(
            new CreateGroupMembershipCommand({
              IdentityStoreId,
              GroupId: group.id,
              MemberId: {UserId: matchedUser.id},
            })
          )
          if (!res.MembershipId)
            throw new Error(
              `Failed to add IdentityStore member ${user.username} in group ${group.displayName}`
            )
          membershipId = res.MembershipId
        }
      })
    )
  })
}
