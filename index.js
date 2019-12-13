const crypto = require("crypto");
const { DataSource } = require("apollo-datasource");
const { InMemoryLRUCache } = require("apollo-server-caching");
const Knex = require("knex");
const knexTinyLogger = require("knex-tiny-logger").default;

const { DEBUG } = process.env;

let hasLogger = false;

class SQLDataSource extends DataSource {
  constructor(knexConfig) {
    super();

    this.context;
    this.cache;
    this.runCache = {};
    this.db = Knex(knexConfig);

    const _this = this;
    if (!this.db.cache) {
      Knex.QueryBuilder.extend("cache", function(ttl) {
        return _this.cacheQuery(ttl, this);
      });
    }
  }

  initialize(config) {
    this.context = config.context;
    this.cache = config.cache || new InMemoryLRUCache();

    if (DEBUG && !hasLogger) {
      hasLogger = true; // Prevent duplicate loggers
      knexTinyLogger(this.db); // Add a logging utility for debugging
    }
  }

  cacheQuery(ttl = 5, query) {
    const cacheKey = crypto
      .createHash("sha1")
      .update(query.toString())
      .digest("base64");

    if (DEBUG && this.runCache[cacheKey])
      console.log(`SQL cache use (${ttl}) [${cacheKey}]`);

    return (
      this.runCache[cacheKey] ||
      (this.runCache[cacheKey] = this.cache.get(cacheKey).then(entry => {
        if (DEBUG)
          console.log(
            `SQL cache ${
              entry ? "get" : "new"
            } (${ttl}) [${cacheKey}] ${query.toString()}`
          );
        if (entry) return Promise.resolve(JSON.parse(entry));

        return query.then(result => {
          if (DEBUG)
            console.log(
              `SQL cache set (${ttl}) [${cacheKey}] ${query.toString()}`
            );
          this.cache.set(cacheKey, JSON.stringify(result), { ttl }).then(() => {
            delete this.runCache[cacheKey];
          });

          return result;
        });
      }))
    );
  }
}

module.exports = { SQLDataSource };
