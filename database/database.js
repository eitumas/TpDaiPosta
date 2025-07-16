import pkg from 'pg';
const { Pool } = pkg;

import dbConfig from '../src/configs/db-config.js';

const pool = new Pool(dbConfig);

export default pool;
