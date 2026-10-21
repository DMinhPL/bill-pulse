import * as migration_20261021_034156_initial from './20261021_034156_initial';
import * as migration_20261021_093134 from './20261021_093134';

export const migrations = [
  {
    up: migration_20261021_034156_initial.up,
    down: migration_20261021_034156_initial.down,
    name: '20261021_034156_initial',
  },
  {
    up: migration_20261021_093134.up,
    down: migration_20261021_093134.down,
    name: '20261021_093134'
  },
];
