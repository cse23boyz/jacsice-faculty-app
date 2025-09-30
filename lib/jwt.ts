import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "389097efaf6fa1b2"

export const signJwt = (payload: object, expiresIn = "8h") => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn })
}

export const verifyJwt = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}
