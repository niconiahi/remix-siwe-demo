interface User {
  address: string
}

export async function createUser(address: User["address"]): Promise<User> {
  return {
    address,
  }
}

export async function getUserByAddress(
  address: User["address"],
): Promise<User> {
  return {
    address,
  }
}
