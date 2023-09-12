import jwt from 'jsonwebtoken';
import { JWT_TOKEN_SECRET } from '../constants/app';
import ApiError from '../utils/apiError';
import type User from '../models/user.model';

interface Dependencies {
  User: typeof User;
}

export const createJwtService = ({ User }: Dependencies) => {
  return Object.freeze({
    signToken: ({
      payload,
    }: {
      payload: string | object | Buffer;
    }): Promise<string> => {
      return new Promise((resolve, reject) => {
        jwt.sign(
          payload,
          JWT_TOKEN_SECRET as string,
          { expiresIn: '1d' },
          (error, token) => {
            if (error) {
              return reject(error);
            }

            resolve(token as string);
          }
        );
      });
    },

    verifyToken: async (token: string | undefined) => {
      if (typeof token === 'undefined') {
        throw new Error('Invalid token.');
      }

      return new Promise((resolve, reject) => {
        jwt.verify(
          token,
          JWT_TOKEN_SECRET as string,
          {},
          async (error, decoded) => {
            if (error) {
              reject(ApiError.notAuthenticated('Invalid token.'));
            }

            const { userId } = decoded as { userId: string };

            if (!userId) {
              reject(ApiError.notAuthenticated('Invalid user.'));
            }

            const user = await User.findById(userId);

            if (!user) {
              reject(ApiError.notAuthenticated('Invalid user.'));
            }

            resolve(user);
          }
        );
      });
    },
  });
};
