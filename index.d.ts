declare module 'datasource-sql' {
  import Knex from 'knex'
  import { KeyValueCache } from 'apollo-server-caching'
  import { DataSource, DataSourceConfig } from 'apollo-datasource'

  declare module 'knex' {
    interface QueryBuilder {
      cache<TRecord, TResult>(ttl: number): QueryBuilder<TRecord, TResult>
    }
  }

  export type SQLDataSourceQuery = Knex.QueryBuilder
  export type SQLDataSourceConfig = Knex.Config

  // eslint-disable-next-line import/prefer-default-export
  export declare abstract class SQLDataSource<TContext = any> extends DataSource<TContext> {
    /* eslint-disable lines-between-class-members */
    protected db: Knex.QueryBuilder
    private cache: KeyValueCache
    protected context: TContext

    constructor(knexConfig: Knex.Config)
    initialize(config: DataSourceConfig<TContext>): void
    protected cacheQuery(ttl: number, query: Knex): Knex.QueryBuilder
  }
}
