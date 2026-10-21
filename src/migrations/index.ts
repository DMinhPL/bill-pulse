import * as migration_20261021_034156_initial from './20261021_034156_initial';
import * as migration_20261021_093134 from './20261021_093134';
import * as migration_20261021_102056 from './20261021_102056';
import * as migration_20261021_104527_invitation_codes from './20261021_104527_invitation_codes';
import * as migration_20261021_105000_invitation_code_user_cascade from './20261021_105000_invitation_code_user_cascade';

export const migrations = [
  {
    up: migration_20261021_034156_initial.up,
    down: migration_20261021_034156_initial.down,
    name: '20261021_034156_initial',
  },
  {
    up: migration_20261021_093134.up,
    down: migration_20261021_093134.down,
    name: '20261021_093134',
  },
  {
    up: migration_20261021_102056.up,
    down: migration_20261021_102056.down,
    name: '20261021_102056',
  },
  {
    up: migration_20261021_104527_invitation_codes.up,
    down: migration_20261021_104527_invitation_codes.down,
    name: '20261021_104527_invitation_codes'
  },
  {
    up: migration_20261021_105000_invitation_code_user_cascade.up,
    down: migration_20261021_105000_invitation_code_user_cascade.down,
    name: '20261021_105000_invitation_code_user_cascade',
  },
];
