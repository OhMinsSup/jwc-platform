import * as migration_20250509_161248 from './20250509_161248';
import * as migration_20250522_145251 from './20250522_145251';

export const migrations = [
  {
    up: migration_20250509_161248.up,
    down: migration_20250509_161248.down,
    name: '20250509_161248',
  },
  {
    up: migration_20250522_145251.up,
    down: migration_20250522_145251.down,
    name: '20250522_145251'
  },
];
