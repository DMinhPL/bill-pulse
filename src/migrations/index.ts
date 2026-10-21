import * as migration_20261021_034156_initial from './20261021_034156_initial';
import * as migration_20261021_093134 from './20261021_093134';
import * as migration_20261021_102056 from './20261021_102056';

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
    name: '20261021_102056'
  },
];
