import * as migration_20250509_161248 from './20250509_161248';
import * as migration_20250522_145251 from './20250522_145251';
import * as migration_20250525_104421 from './20250525_104421';
import * as migration_20250529_171345 from './20250529_171345';
import * as migration_20250529_180242 from './20250529_180242';
import * as migration_20250529_180403 from './20250529_180403';
import * as migration_20250530_043949 from './20250530_043949';
import * as migration_20250530_044147 from './20250530_044147';
import * as migration_20250530_050618 from './20250530_050618';
import * as migration_20250601_063949 from './20250601_063949';

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
    name: '20250525_104421',
  },
  {
    up: migration_20250529_171345.up,
    down: migration_20250529_171345.down,
    name: '20250529_171345',
  },
  {
    up: migration_20250529_180242.up,
    down: migration_20250529_180242.down,
    name: '20250529_180242',
  },
  {
    up: migration_20250529_180403.up,
    down: migration_20250529_180403.down,
    name: '20250529_180403',
  },
  {
    up: migration_20250530_043949.up,
    down: migration_20250530_043949.down,
    name: '20250530_043949',
  },
  {
    up: migration_20250530_044147.up,
    down: migration_20250530_044147.down,
    name: '20250530_044147',
  },
  {
    up: migration_20250530_050618.up,
    down: migration_20250530_050618.down,
    name: '20250530_050618',
  },
  {
    up: migration_20250601_063949.up,
    down: migration_20250601_063949.down,
    name: '20250601_063949'
  },
];
