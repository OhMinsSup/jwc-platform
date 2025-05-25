import * as migration_20250509_161248 from './20250509_161248';
import * as migration_20250522_145251 from './20250522_145251';
import * as migration_20250525_104421 from './20250525_104421';

export const migrations = [
  {
    up: migration_20250509_161248.up,
    down: migration_20250509_161248.down,
    name: '20250509_161248',
  },
  {
    up: migration_20250522_145251.up,
    down: migration_20250522_145251.down,
    name: '20250522_145251',
  },
  {
    up: migration_20250525_104421.up,
    down: migration_20250525_104421.down,
    name: '20250525_104421'
  },
];
