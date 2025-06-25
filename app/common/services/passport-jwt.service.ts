import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import passport from 'passport'
import { Strategy, ExtractJwt } from 'passport-jwt'
import { Strategy as LocalStrategy } from 'passport-local'
import createError from 'http-errors'
import * as userService from '../../user/user.service'
import { type Request } from 'express'
import { IUser } from '../../user/user.dto'

const isValidPassword = async function (value: string, password: string) {
    const compare = await bcrypt.compare(value, password)
    return compare
}

export const initPassport = (): void => {
    passport.use(
        new Strategy(
            {
                secretOrKey: process.env.JWT_SECRET!,
                jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            },
            async (token: { user: Request['user'] }, done) => {
                try {
                    done(null, token.user)
                } catch (error) {
                    done(error)
                }
            }
        )
    )

    passport.use(
        'login',
        new LocalStrategy(
            {
                usernameField: 'email',
                passwordField: 'password',
            },
            async (email, password, done) => {
                try {
                    const user = await userService.getUserByEmail(email)

                    if (user == null) {
                        done(createError(401, 'User not found!'), false)
                        return
                    }

                    const validate = await isValidPassword(
                        password,
                        user.password
                    )
                    if (!validate) {
                        done(
                            createError(401, 'Invalid email or password'),
                            false
                        )
                        return
                    }

                    const { password: _, ...result } = user.toObject()

                    done(null, result, { message: 'Logged in Successfully' })
                } catch (error: any) {
                    done(createError(500, error.message))
                }
            }
        )
    )
	
}

export const createUserTokens = (user: Omit<IUser, 'password'>) => {
	const jwtSecret = process.env.JWT_SECRET ?? ''
	const accessToken = jwt.sign(user, jwtSecret, {
		expiresIn: '7d',
	})
	const refreshToken = jwt.sign({ user }, jwtSecret, {
		expiresIn: '7d',
	})
	return { access_token: accessToken, refresh_token: refreshToken }
}

export const decodeToken = (token: string) => {
    // const jwtSecret = process.env.JWT_SECRET ?? "";
    const decode = jwt.decode(token)
    return decode as IUser
}

export const verifyToken = (token: string) => {
	const jwtSecret = process.env.JWT_SECRET ?? ''
	const decode = jwt.verify(token, jwtSecret)
	return decode as IUser
}

export const authenticate = passport.authenticate('jwt', { session: false })
export const authenticateLogin = passport.authenticate('login', { session: false })



export const destroyToken = (token: string) => {
	const jwtSecret = process.env.JWT_SECRET ||'Secret'
	const decode = jwt.verify(token, jwtSecret)
		// @ts-ignore
		const user = decode.user as IUser
		// @ts-ignore
		// delete user.password
		return user
}

export const checkToken = async (token:string) => {
   
    try {
        const jwtSecret = process.env.JWT_SECRET || "Secret";
        const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
		return decoded as IUser;
		
    } catch (error: any) {
        return error.message;
    }
}