// Thin Neon/Postgres-backed replacement for the Supabase client. Every route in
// this app calls `supabase.from(table).select/insert/update/delete/upsert(...)`
// using Supabase's chainable query-builder shape -- this file reimplements just
// the subset of that shape actually used across the codebase, backed by a real
// `@neondatabase/serverless` Pool instead. Every other file keeps importing
// `{ supabase }` from "@/lib/supabase" completely unchanged.
//
// Migrated off Supabase because the "WVW Dashboard" Supabase project is paused
// (confirmed 2026-08) and the team's database of record is Neon. New Neon
// project (not the shared wvw-platform one -- kept separate on purpose) with
// six content-pipeline tables: post_log, social_stats, content_queue, leads,
// conversions, blog_posts. The other ~16 tables this app also references
// (habits, medications, sleep_logs, reviews, etc. -- personal life-tracking,
// not content) do NOT exist in this database yet; those routes will get a
// clean {data: null, error} instead of a thrown exception, same as they did
// with an unreachable Supabase project, until migrated separately.
import { Pool } from "@neondatabase/serverless";

let pool: Pool | undefined;

function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set -- cannot connect to Postgres.");
  if (!pool) pool = new Pool({ connectionString });
  return pool;
}

type Row = Record<string, unknown>;
type QueryResult<T> = { data: T | null; error: { message: string } | null };

type FilterOp = "=" | ">=" | ">" | "<" | "<=" | "like" | "ilike" | "in" | "is not null";
interface Filter { col: string; op: FilterOp; val: unknown }
interface OrderBy { col: string; ascending: boolean }

// T represents one row's shape (defaults to `any`, matching the real Supabase
// client's un-annotated behavior). A plain query resolves to T[] -- an array,
// same as Supabase -- so callers' .map()/.reduce() callbacks type-check the
// same way they did against the real client. .single() switches the *static*
// return type to T (not T[]) via SingleResultBuilder below; the underlying
// object and runtime logic are unchanged, only the compile-time view differs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SingleResultBuilder<T = any> = PromiseLike<QueryResult<T>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class QueryBuilder<T = any> implements PromiseLike<QueryResult<T[]>> {
  private op: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private cols = "*";
  private filters: Filter[] = [];
  private orderBys: OrderBy[] = [];
  private limitN: number | undefined;
  private writeData: Row | Row[] | undefined;
  private conflictCol: string | undefined;
  private wantReturning = false;
  private wantSingle = false;

  constructor(private table: string) {}

  select(cols = "*"): this {
    if (this.op === "select") this.cols = cols;
    else { this.wantReturning = true; this.cols = cols; }
    return this;
  }
  insert(data: Row | Row[]): this { this.op = "insert"; this.writeData = data; return this; }
  update(data: Row): this { this.op = "update"; this.writeData = data; return this; }
  upsert(data: Row | Row[], opts?: { onConflict?: string }): this {
    this.op = "upsert"; this.writeData = data; this.conflictCol = opts?.onConflict; return this;
  }
  delete(): this { this.op = "delete"; return this; }
  eq(col: string, val: unknown): this { this.filters.push({ col, op: "=", val }); return this; }
  gte(col: string, val: unknown): this { this.filters.push({ col, op: ">=", val }); return this; }
  gt(col: string, val: unknown): this { this.filters.push({ col, op: ">", val }); return this; }
  lt(col: string, val: unknown): this { this.filters.push({ col, op: "<", val }); return this; }
  lte(col: string, val: unknown): this { this.filters.push({ col, op: "<=", val }); return this; }
  in(col: string, vals: unknown[]): this { this.filters.push({ col, op: "in", val: vals }); return this; }
  like(col: string, pattern: string): this { this.filters.push({ col, op: "like", val: pattern }); return this; }
  ilike(col: string, pattern: string): this { this.filters.push({ col, op: "ilike", val: pattern }); return this; }
  // Only the "is"/null negation form is actually used in this codebase (e.g. `.not("due_date", "is", null)`).
  not(col: string, operator: string, value: unknown): this {
    if (operator === "is" && value === null) this.filters.push({ col, op: "is not null", val: undefined });
    else throw new Error(`QueryBuilder.not() only supports ("col", "is", null) -- got ("${col}", "${operator}", ${JSON.stringify(value)})`);
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }): this {
    this.orderBys.push({ col, ascending: opts?.ascending ?? true });
    return this;
  }
  limit(n: number): this { this.limitN = n; return this; }
  single(): SingleResultBuilder<T> {
    this.wantSingle = true;
    return this as unknown as SingleResultBuilder<T>;
  }

  private buildWhere(startIdx: number): { clause: string; params: unknown[] } {
    if (!this.filters.length) return { clause: "", params: [] };
    const parts: string[] = [];
    const params: unknown[] = [];
    let i = startIdx;
    for (const f of this.filters) {
      if (f.op === "is not null") {
        parts.push(`"${f.col}" is not null`);
      } else if (f.op === "in") {
        const arr = f.val as unknown[];
        parts.push(`"${f.col}" in (${arr.map(() => `$${i++}`).join(",")})`);
        params.push(...arr);
      } else if (f.op === "like") {
        parts.push(`"${f.col}" like $${i++}`);
        params.push(f.val);
      } else {
        parts.push(`"${f.col}" ${f.op} $${i++}`);
        params.push(f.val);
      }
    }
    return { clause: `where ${parts.join(" and ")}`, params };
  }

  // Loosely typed on purpose -- the real shape (array vs single row) depends on
  // wantSingle at runtime; then() below presents the correct static type per call site.
  private async execute(): Promise<QueryResult<unknown>> {
    try {
      const client = getPool();
      let text: string;
      let params: unknown[] = [];

      if (this.op === "select") {
        const { clause, params: wp } = this.buildWhere(1);
        params = wp;
        const orderSql = this.orderBys.length
          ? ` order by ${this.orderBys.map((o) => `"${o.col}" ${o.ascending ? "asc" : "desc"}`).join(", ")}`
          : "";
        const limitSql = this.limitN != null ? ` limit ${this.limitN}` : "";
        text = `select ${this.cols} from "${this.table}" ${clause}${orderSql}${limitSql}`;
      } else if (this.op === "insert" || this.op === "upsert") {
        const rows = Array.isArray(this.writeData) ? this.writeData : [this.writeData as Row];
        if (rows.length === 0) return { data: this.wantSingle ? null : [], error: null };
        const cols = Object.keys(rows[0]);
        let i = 1;
        const valuesSql = rows.map((row) => {
          const placeholders = cols.map(() => `$${i++}`);
          params.push(...cols.map((c) => row[c]));
          return `(${placeholders.join(",")})`;
        });
        const colsSql = cols.map((c) => `"${c}"`).join(",");
        const returning = this.wantReturning ? ` returning ${this.cols}` : "";
        if (this.op === "upsert") {
          const conflictCol = this.conflictCol ?? cols[0];
          const updateSet = cols
            .filter((c) => c !== conflictCol)
            .map((c) => `"${c}" = excluded."${c}"`)
            .join(",");
          text = `insert into "${this.table}" (${colsSql}) values ${valuesSql.join(",")} on conflict ("${conflictCol}") do update set ${updateSet}${returning}`;
        } else {
          text = `insert into "${this.table}" (${colsSql}) values ${valuesSql.join(",")}${returning}`;
        }
      } else if (this.op === "update") {
        const data = this.writeData as Row;
        const cols = Object.keys(data);
        let i = 1;
        const setSql = cols.map((c) => `"${c}" = $${i++}`).join(",");
        params.push(...cols.map((c) => data[c]));
        const { clause, params: wp } = this.buildWhere(i);
        params.push(...wp);
        const returning = this.wantReturning ? ` returning ${this.cols}` : "";
        text = `update "${this.table}" set ${setSql} ${clause}${returning}`;
      } else {
        const { clause, params: wp } = this.buildWhere(1);
        params = wp;
        text = `delete from "${this.table}" ${clause}`;
      }

      const result = await client.query(text, params);
      const data = this.wantSingle ? (result.rows[0] ?? null) : result.rows;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: { message: err instanceof Error ? err.message : String(err) } };
    }
  }

  then<TResult1 = QueryResult<T[]>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled as (value: QueryResult<unknown>) => TResult1 | PromiseLike<TResult1>, onrejected);
  }
}

export const supabase = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from<T = any>(table: string): QueryBuilder<T> {
    return new QueryBuilder<T>(table);
  },
};

export interface BlogPost {
  id: string;
  created_at: string;
  title: string;
  slug: string;
  meta_description: string | null;
  content_markdown: string;
  theme: string | null;
  published: boolean;
  source: string | null;
}

export interface PostLogEntry {
  id: string;
  created_at: string;
  platform: string;
  theme: string;
  excerpt: string | null;
  status: "posted" | "queued" | "error" | "skipped";
}
