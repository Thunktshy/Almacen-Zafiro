const sql = require('mssql');

const config = {
  user:     process.env.DB_USER     || 'tienda_user',
  password: process.env.DB_PASSWORD || 'Str0ng_P@ssw0rd!',
  server:   process.env.DB_HOST     || 'localhost',
  database: process.env.DB_NAME     || 'tiendaonline',
  options: {
    encrypt: false, 
    trustServerCertificate: true, 
  },
  pool: {
    max:  5,
    min:  0,
    idleTimeoutMillis: 30000
  }
};

class DBConnector {
  constructor() {
    this.pool      = new sql.ConnectionPool(config);
    this.poolReady = this.pool.connect();
  }

  async query(queryText) {
    await this.poolReady;
    try {
      const result = await this.pool.request().query(queryText);
      return result.recordset;
    } catch (err) {
      console.error('Error en el query:', err);
      throw err;
    }
  }

  async queryWithParams(queryText, params = {}) {
    await this.poolReady;
    const req = this.pool.request();
    for (const [name, value] of Object.entries(params)) {
      req.input(name, value);
    }
    try {
      const result = await req.query(queryText);
      return result.recordset;
    } catch (err) {
      console.error('QueryWithParams error:', err);
      throw err;
    }
  }

  async close() {
    await this.pool.close();
  }
}

module.exports = new DBConnector();
