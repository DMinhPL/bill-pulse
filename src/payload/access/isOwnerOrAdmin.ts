import type { Access } from 'payload';

export const isOwnerOrAdmin: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true;
  if (req.user?.collection === 'users') return { user: { equals: req.user.id } };
  return false;
};
