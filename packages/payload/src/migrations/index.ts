import * as migration_20250702_070755 from './20250702_070755';
import * as migration_20250704_010322 from './20250704_010322';
import * as migration_20250705_060634 from './20250705_060634';

export const migrations = [
  {
    up: migration_20250702_070755.up,
    down: migration_20250702_070755.down,
    name: '20250702_070755',
  },
  {
    up: migration_20250704_010322.up,
    down: migration_20250704_010322.down,
    name: '20250704_010322',
  },
  {
    up: migration_20250705_060634.up,
    down: migration_20250705_060634.down,
    name: '20250705_060634'
  },
];
