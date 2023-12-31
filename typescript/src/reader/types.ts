import { ByWrapper, Option } from "../common-types";

// QUERY
export interface QueryDocuments {
  query_embedding?: Option<{ values: number[]; dimensionality }>;
  sql?: Option<string>;
  params?: Option<Array<string | number>>;
  text_search_query?: Option<string[]>;
}

export type QueryRequest = ByWrapper<QueryDocuments>;

export interface QueryResponse {
  collection_id: string;
  result_count: number;
  sql?: Option<string>;
  results: {
    __id: string;
    __distance?: Option<number>;
    __score?: Option<number>;
    [key: string]: string | number | undefined | null;
  }[];
}

// INFER SCHEMA
export enum InferredType {
  String,
  Number,
  Boolean,
  Array,
  Object,
}

export interface InferredSchema {
  types: Record<string, InferredType[]>;
  nullability: Record<string, boolean>;
}

export type InferSchemaRequest = ByWrapper<{}>;

export interface InferSchemaResponse {
  inferred_schema: InferredSchema;
}
