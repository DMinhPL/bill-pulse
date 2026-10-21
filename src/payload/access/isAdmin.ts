import type { Access } from 'payload';

export const isAdmin: Access = ({ req }) => req.user?.collection === 'admins';
