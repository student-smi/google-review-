import * as fs from 'fs';
import * as path from 'path';

const sqlPath = path.resolve(process.cwd(), 'scripts', 'seed.sql');
console.log('Seed SQL file is ready at:', sqlPath);
