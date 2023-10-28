import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import ky, { KyResponse } from "ky-universal";
import { v4 as uuid4 } from "uuid";

import {
  COLLECTIONS_PATH,
  DOCUMENTS_PATH,
  QUERY_PATH,
  INFER_SCHEMA_PATH,
  API_KEY_HEADER_NAME,
  MISSING_DOCUMENT_METADATA_IN_REQUEST_ERROR,
  CREATE_COLLECTION_MISSING_NAME_ERROR,
  WRITER_URL,
  READER_URL,
  MISSING_DOCUMENT_ID_IN_REQUEST_ERROR,
} from "../src/constants";
import {
  UpdateRequest,
  DeleteRequest,
  InsertRequest,
  TransposeAndInsertRequest,
} from "../src/index";
import { db } from "../src/index";

// Mock Ky
vi.mock("ky-universal");

// Mock OpenAI
vi.mock("openai");

beforeAll(() => {
  vi.mocked(ky.create).mockReturnThis();
  vi.mocked(ky.extend).mockReturnThis();
});

afterEach(() => {
  vi.mocked(
    ky.extend({
      prefixUrl: WRITER_URL,
    }).delete
  ).mockClear();
  vi.mocked(
    ky.extend({
      prefixUrl: WRITER_URL,
    }).patch
  ).mockClear();
  vi.mocked(
    ky.extend({
      prefixUrl: WRITER_URL,
    }).post
  ).mockClear();
  vi.mocked(
    ky.extend({
      prefixUrl: READER_URL,
    }).post
  ).mockClear();
});

describe("db.initialize", () => {
  it("should correctly set apiKey and default urls", () => {
    const MOCK_API_KEY = uuid4();
    const spy = vi.spyOn(db, "initialize");
    db.initialize(MOCK_API_KEY);
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(MOCK_API_KEY);
    expect(vi.mocked(ky.create)).toHaveBeenCalledWith({
      headers: {
        [API_KEY_HEADER_NAME]: MOCK_API_KEY,
      },
    });
  });
  it("should correctly set writerURLHost if valid host given", () => {
    const MOCK_API_KEY = uuid4();
    const MOCK_WRITER_URL_HOST = "https://200testhost.com";
    const spy = vi.spyOn(db, "initialize");
    db.initialize(MOCK_API_KEY, { writerHostURL: MOCK_WRITER_URL_HOST });
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(MOCK_API_KEY, {
      writerHostURL: MOCK_WRITER_URL_HOST,
    });
    expect(vi.mocked(ky.create)).toHaveBeenCalledWith({
      headers: {
        [API_KEY_HEADER_NAME]: MOCK_API_KEY,
      },
    });
  });
  it("should correctly set readerURLHost if valid host given", () => {
    const MOCK_API_KEY = uuid4();
    const MOCK_READER_URL_HOST = "https://200testhost.com";
    const spy = vi.spyOn(db, "initialize");
    db.initialize(MOCK_API_KEY, { readerHostURL: MOCK_READER_URL_HOST });
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(MOCK_API_KEY, {
      readerHostURL: MOCK_READER_URL_HOST,
    });
    expect(vi.mocked(ky.create)).toHaveBeenCalledWith({
      headers: {
        [API_KEY_HEADER_NAME]: MOCK_API_KEY,
      },
    });
  });
});

describe("insertDocuments", () => {
  it("returns a 200 response", async () => {
    const COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: COLLECTION_ID,
      documents: [
        {
          embeddings: { values: [0.1, 0.2, 0.3], dimensionality: 3 },
          metadata: { car: "abe", apple: "john", inventory_count: 12 },
        },
      ],
    };

    await dbClient.insertDocuments(mockRequest);
    expect(
      vi.mocked(
        ky.extend({
          prefixUrl: WRITER_URL,
        }).post
      )
    ).toHaveBeenCalledWith(DOCUMENTS_PATH, { json: mockRequest });
  });
  it("returns an error if document is not provided", async () => {
    const COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    vi.spyOn(dbClient, "insertDocuments");
    const mockRequest = {
      collection_id: COLLECTION_ID,
    };

    await dbClient.insertDocuments(mockRequest as any);
    expect(
      vi.mocked(
        ky.extend({
          prefixUrl: WRITER_URL,
        }).post
      )
    ).not.toHaveBeenCalled();
  });
});

describe("updateDocuments", () => {
  it("returns a 200 response", async () => {
    const COLLECTION_ID = uuid4();
    const DOCUMENT_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest: UpdateRequest = {
      collection_id: COLLECTION_ID,
      documents: [
        {
          id: DOCUMENT_ID,
          metadata: { car: "updated_value" },
        },
      ],
    };

    await dbClient.updateDocuments(mockRequest);
    expect(
      vi.mocked(
        ky.extend({
          prefixUrl: WRITER_URL,
        }).patch
      )
    ).toHaveBeenCalledWith(DOCUMENTS_PATH, { json: mockRequest });
  });
  it("returns an error if documents is not provided", async () => {
    const COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: COLLECTION_ID,
      documents: [],
    };

    await dbClient.updateDocuments(mockRequest);
    expect(
      vi.mocked(
        ky.extend({
          prefixUrl: WRITER_URL,
        }).patch
      )
    ).not.toHaveBeenCalled();
  });
  it("returns an error if documents in request do not have an id", async () => {
    const COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: COLLECTION_ID,
      documents: [
        {
          metadata: { car: "apple" },
        },
      ],
    };
    const mockResponse: KyResponse = {
      status: 200,
      headers: new Headers(),
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      json: vi.fn().mockResolvedValue({
        data: null,
        error: { error_message: MISSING_DOCUMENT_ID_IN_REQUEST_ERROR },
      }),
      text: vi.fn(),
      redirected: false,
      url: "",
      clone: vi.fn(),
      type: "default",
      ok: false,
      statusText: "",
      body: undefined,
      bodyUsed: false,
    };
    vi.mocked(
      ky.extend({
        prefixUrl: WRITER_URL,
      }).patch
    ).mockResolvedValue(mockResponse);
    await dbClient.updateDocuments(mockRequest as any);
    expect(
      vi.mocked(
        ky.extend({
          prefixUrl: WRITER_URL,
        }).patch
      )
    ).toHaveBeenCalled();
  });
  it("returns an error if documents in request do not have metadata", async () => {
    const COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const DOCUMENT_ID = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: COLLECTION_ID,
      documents: [
        {
          id: DOCUMENT_ID,
          metadata: null,
        },
      ],
    };
    await dbClient.updateDocuments(mockRequest as any);
    const mockResponse: KyResponse = {
      status: 200,
      headers: new Headers(),
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      json: vi.fn().mockResolvedValue({
        data: null,
        error: { error_message: MISSING_DOCUMENT_METADATA_IN_REQUEST_ERROR },
      }),
      text: vi.fn(),
      redirected: false,
      url: "",
      clone: vi.fn(),
      type: "default",
      ok: false,
      statusText: "",
      body: undefined,
      bodyUsed: false,
    };
    vi.mocked(
      ky.extend({
        prefixUrl: WRITER_URL,
      }).patch
    ).mockResolvedValue(mockResponse);
    expect(
      vi.mocked(
        ky.extend({
          prefixUrl: WRITER_URL,
        }).patch
      )
    ).toHaveBeenCalled();
  });
});

describe("deleteDocuments", () => {
  it("should return a 200 response", async () => {
    const MOCK_COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const DOCUMENT_ID = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest: DeleteRequest = {
      collection_id: MOCK_COLLECTION_ID,
      ids: [DOCUMENT_ID],
    };

    await dbClient.deleteDocuments(mockRequest);
    expect(
      vi.mocked(
        ky.extend({
          prefixUrl: WRITER_URL,
        }).delete
      )
    ).toHaveBeenCalledWith(DOCUMENTS_PATH, {
      json: mockRequest,
    });
  });
  it("should return an error if no document ids are provided", async () => {
    const MOCK_COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest: DeleteRequest = {
      collection_id: MOCK_COLLECTION_ID,
      ids: [],
    };

    await dbClient.deleteDocuments(mockRequest);
    expect(
      vi.mocked(
        ky.extend({
          prefixUrl: WRITER_URL,
        }).delete
      )
    ).not.toHaveBeenCalled();
  });
});

describe("queryDocuments", () => {
  it("should return a 200 response given a collection id", async () => {
    const COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: COLLECTION_ID,
    };

    await dbClient.query(mockRequest);
    expect(
      vi.mocked(
        ky.extend({
          prefixUrl: READER_URL,
        }).post
      )
    ).toHaveBeenCalledWith(QUERY_PATH, { json: mockRequest });
  });
  it("should return an 200 response if query embedding is given", async () => {
    const COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: COLLECTION_ID,
      query_embedding: { values: [0.1, 0.2, 0.3], dimensionality: 3 },
    };

    await dbClient.query(mockRequest as any);
    expect(
      vi.mocked(
        ky.extend({
          prefixUrl: READER_URL,
        }).post
      )
    ).toHaveBeenCalledWith(QUERY_PATH, { json: mockRequest });
  });
});

describe("inferSchema", () => {
  it("should return a 200 response given a collection id", async () => {
    const COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: COLLECTION_ID,
    };

    await dbClient.inferSchema(mockRequest);
    expect(
      vi.mocked(
        ky.extend({
          prefixUrl: READER_URL,
        }).post
      )
    ).toHaveBeenCalledWith(INFER_SCHEMA_PATH, { json: mockRequest });
  });
});

describe("columnInsert", () => {
  it("should return a 200 response for same length embedding list and metadata list", async () => {
    const MOCK_COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest: TransposeAndInsertRequest = {
      collection_id: MOCK_COLLECTION_ID,
      embeddings: [
        { values: [0.1, 0.2], dimensionality: 2 },
        { values: [0.1, 0.4], dimensionality: 2 },
      ],
      document_metadata: [
        { car: 1, horse: "neigh" },
        { car: 2, horse: "bleh" },
      ],
    };
    const mockInsertRequest: InsertRequest = {
      collection_id: MOCK_COLLECTION_ID,
      documents: [
        {
          embeddings: { values: [0.1, 0.2], dimensionality: 2 },
          metadata: { car: 1, horse: "neigh" },
        },
        {
          embeddings: { values: [0.1, 0.4], dimensionality: 2 },
          metadata: { car: 2, horse: "bleh" },
        },
      ],
    };

    await dbClient.columnInsert(mockRequest);
    expect(
      vi.mocked(
        ky.extend({
          prefixUrl: WRITER_URL,
        }).post
      )
    ).toHaveBeenCalledWith(DOCUMENTS_PATH, { json: mockInsertRequest });
  });
  it("should return a 200 response if embeddings list is shorter than document metadata list", async () => {
    const MOCK_COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: MOCK_COLLECTION_ID,
      embeddings: [{ values: [0.1, 0.4], dimensionality: 2 }],
      document_metadata: [
        { car: 1, horse: "neigh" },
        { car: 2, horse: "bleh" },
      ],
    };
    const mockInsertRequest = {
      collection_id: MOCK_COLLECTION_ID,
      documents: [
        {
          embeddings: { values: [0.1, 0.4], dimensionality: 2 },
          metadata: { car: 1, horse: "neigh" },
        },
      ],
    };

    await dbClient.columnInsert(mockRequest);
    expect(
      vi.mocked(
        ky.extend({
          prefixUrl: WRITER_URL,
        }).post
      )
    ).toHaveBeenCalledWith(DOCUMENTS_PATH, { json: mockInsertRequest });
  });
  it("should return a 200 response if metadata list is shorter than embedding list", async () => {
    const MOCK_COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: MOCK_COLLECTION_ID,
      embeddings: [
        { values: [0.1, 0.2], dimensionality: 2 },
        { values: [0.4, 0.3], dimensionality: 2 },
      ],
      document_metadata: [{ car: 1, horse: "neigh" }, undefined],
    };
    const mockInsertRequest = {
      collection_id: MOCK_COLLECTION_ID,
      documents: [
        {
          embeddings: { values: [0.1, 0.2], dimensionality: 2 },
          metadata: { car: 1, horse: "neigh" },
        },
        {
          embeddings: { values: [0.4, 0.3], dimensionality: 2 },
        },
      ],
    };

    await dbClient.columnInsert(mockRequest);
    expect(
      vi.mocked(
        ky.extend({
          prefixUrl: WRITER_URL,
        }).post
      )
    ).toHaveBeenCalledWith(DOCUMENTS_PATH, { json: mockInsertRequest });
  });
  it("should return an error if embedding list is empty", async () => {
    const MOCK_COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: MOCK_COLLECTION_ID,
      embeddings: [],
      document_metadata: [
        { car: 1, horse: "neigh" },
        { car: 2, horse: "bleh" },
      ],
    };

    await dbClient.columnInsert(mockRequest);
    expect(
      vi.mocked(
        ky.extend({
          prefixUrl: WRITER_URL,
        }).post
      )
    ).not.toHaveBeenCalled();
  });
});

describe("createCollection", () => {
  it("should return a 200 response", async () => {
    const MOCK_COLLECTION_NAME = "first collection test";
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      name: MOCK_COLLECTION_NAME,
      dimensionality: 10,
    };

    await dbClient.createCollection(mockRequest);
    expect(
      vi.mocked(
        ky.extend({
          prefixUrl: WRITER_URL,
        }).post
      )
    ).toHaveBeenCalledWith(COLLECTIONS_PATH, { json: mockRequest });
  });
  it("should return an error if collection name not specified", async () => {
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      name: null,
      dimensionality: 10,
    };
    const mockResponse = {
      json: async () => ({
        data: null,
        error: { error_message: CREATE_COLLECTION_MISSING_NAME_ERROR },
      }),
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers(),
      redirected: false,
      url: "",
      clone: () => mockResponse,
      type: "default",
      body: null,
      bodyUsed: false,
      arrayBuffer: async () => new ArrayBuffer(0),
      blob: async () => new Blob(),
      formData: async () => new FormData(),
      text: async () => "",
    };

    vi.mocked(
      ky.extend({
        prefixUrl: WRITER_URL,
      }).post
    ).mockResolvedValue(mockResponse as KyResponse);
    await dbClient.createCollection(mockRequest as any);
    expect(
      vi.mocked(
        ky.extend({
          prefixUrl: WRITER_URL,
        }).post
      )
    ).not.toHaveBeenCalled();
  });
  it("should return an error if dimensionality not specified", async () => {
    const MOCK_COLLECTION_NAME = "first collection test";
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      name: MOCK_COLLECTION_NAME,
      dimensionality: null,
    };

    await dbClient.createCollection(mockRequest as any);
    expect(
      vi.mocked(
        ky.extend({
          prefixUrl: WRITER_URL,
        }).post
      )
    ).not.toHaveBeenCalled();
  });
  it("should return an error if dimensionality less than or equal to zero", async () => {
    const MOCK_COLLECTION_NAME = "first collection test";
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      name: MOCK_COLLECTION_NAME,
      dimensionality: 0,
    };

    await dbClient.createCollection(mockRequest);
    expect(
      vi.mocked(
        ky.extend({
          prefixUrl: WRITER_URL,
        }).post
      )
    ).not.toHaveBeenCalled();
  });
});

describe("deleteCollection", () => {
  it("should return a 200 response", async () => {
    const MOCK_COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: MOCK_COLLECTION_ID,
    };

    await dbClient.deleteCollection(mockRequest);
    expect(
      vi.mocked(
        ky.extend({
          prefixUrl: WRITER_URL,
        }).delete
      )
    ).toHaveBeenCalledWith(COLLECTIONS_PATH, {
      json: mockRequest,
    });
  });
});
