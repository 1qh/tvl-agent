interface Entitlements {
  maxMessagesPerDay: number
}
type UserType = 'guest' | 'regular'

export default {
  guest: {
    maxMessagesPerDay: 1
  },
  regular: {
    maxMessagesPerDay: 20
  }
} satisfies Record<UserType, Entitlements>
