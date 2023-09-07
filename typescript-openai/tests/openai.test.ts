import ky from "ky-universal";
import { v4 as uuid4 } from "uuid";
import { TransposeAndInsertRequest, db } from "starpoint";
import { READER_URL, WRITER_URL } from "../src/constants";
import { starpointOpenai } from "../src";
import { OpenAIApi } from "openai";
import { BuildAndInsertEmbeddingsFromOpenAIRequest } from "../src/types";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

// Mock ky-universal
// TODO: fix this later
// vi.mock("ky-universal");

// // Mock OpenAI
// vi.mock("openai");
// const createEmbeddingSpy = vi.spyOn(OpenAIApi.prototype, "createEmbedding");
// const starpointDbClientSpy = vi.spyOn(db, "initialize");
// vi.mock("starpoint", () => {
//   return {
//     db: {
//       initialize: (
//         apiKey: string,
//         options?: {
//           writerHostURL?: string;
//           readerHostURL?: string;
//           embeddingHostURL?: string;
//           openaiKey?: string;
//         }
//       ) => {
//         return {
//           columnInsert: vi.fn(),
//         };
//       },
//     },
//   };
// });
// const starpointOpenAiClientSpy = vi.spyOn(starpointOpenai, "initialize");

// beforeAll(() => {
//   vi.mocked(ky.create).mockReturnThis();
//   vi.mocked(ky.extend).mockReturnThis();
// });

// afterEach(() => {
//   vi.mocked(
//     ky.extend({
//       prefixUrl: WRITER_URL,
//     }).delete
//   ).mockClear();
//   vi.mocked(
//     ky.extend({
//       prefixUrl: WRITER_URL,
//     }).patch
//   ).mockClear();
//   vi.mocked(
//     ky.extend({
//       prefixUrl: WRITER_URL,
//     }).post
//   ).mockClear();
//   starpointDbClientSpy.mockClear();
//   starpointOpenAiClientSpy.mockClear();
//   createEmbeddingSpy.mockClear();
// });

// describe("starpointOpenAi.initialize", () => {
//   it("should correctly set openAIKey and starpointAi and default urls", () => {
//     const MOCK_OPENAI_KEY = uuid4();
//     const MOCK_API_KEY = uuid4();
//     const dbClient = db.initialize(MOCK_API_KEY);
//     expect(starpointDbClientSpy).toHaveBeenCalled();
//     expect(starpointDbClientSpy).toHaveBeenCalledWith(MOCK_API_KEY);
//     starpointOpenai.initialize(MOCK_OPENAI_KEY, dbClient);
//     expect(starpointOpenAiClientSpy).toHaveBeenCalled();
//     expect(starpointOpenAiClientSpy).toHaveBeenCalledWith(
//       MOCK_OPENAI_KEY,
//       dbClient
//     );
//   });
// });

// describe("buildAndInsertEmbeddings", () => {
//   it("should return an openai response, but not a starpoint response", async () => {
//     const MOCK_COLLECTION_ID = uuid4();
//     const MOCK_API_KEY = uuid4();
//     const dbClient = db.initialize(MOCK_API_KEY);
//     const MOCK_OPENAI_KEY = uuid4();
//     const mockRequest = {
//       collection_id: MOCK_COLLECTION_ID,
//       input_data: "this is test input",
//     };
//     const starpointOpenAiClient = starpointOpenai.initialize(
//       MOCK_OPENAI_KEY,
//       dbClient
//     );
//     const columnInsertSpy = vi.spyOn(dbClient, "columnInsert");

//     await starpointOpenAiClient.buildAndInsertEmbeddings(mockRequest);
//     // check that mock returned an openai response
//     expect(createEmbeddingSpy).toHaveBeenCalled();

//     // check that starpoint column insert is not called;
//     expect(columnInsertSpy).not.toHaveBeenCalled();

//     columnInsertSpy.mockReset();
//   });
//   it("should return both an openai response and a starpoint response", async () => {
//     const MOCK_COLLECTION_ID = uuid4();
//     const MOCK_API_KEY = uuid4();
//     const dbClient = db.initialize(MOCK_API_KEY);

//     const MOCK_OPENAI_KEY = uuid4();
//     const mockRequest = {
//       collection_id: MOCK_COLLECTION_ID,
//       input_data: "this is test input",
//     };
//     const starpointOpenAiClient = starpointOpenai.initialize(
//       MOCK_OPENAI_KEY,
//       dbClient
//     );
//     // const mockColumnInsertRequest: TransposeAndInsertRequest = {
//     //   collection_id: MOCK_COLLECTION_ID,
//     //   embeddings: [
//     //     [0.1, 0.2],
//     //     [0.1, 0.4],
//     //   ],
//     //   document_metadata: [
//     //     { car: 1, horse: "neigh" },
//     //     { car: 2, horse: "bleh" },
//     //   ],
//     // };
//     // console.log("column insert response", dbClient.columnInsert(mockColumnInsertRequest))

//     expect(dbClient.columnInsert).toBeDefined();

//     const mockCreateEmbeddingResponse = {
//       data: {
//         object: "mock",
//         model: "text-embedding-ada-002",
//         usage: { prompt_tokens: 0, total_tokens: 0 },
//         data: [
//           { index: 1, embedding: [0.1, 0.2, 0.3], object: "mock" },
//           { index: 2, embedding: [0.4, 0.5, 0.6], object: "mock" },
//         ],
//       },
//       status: 200,
//       statusText: "ok",
//       headers: {},
//       config: {},
//     };
//     const mockColumnInsertResponse = {
//       data: {
//         collection_id: MOCK_COLLECTION_ID,
//         documents: [],
//       },
//       error: null,
//     };

//     const columnInsertSpy = vi.spyOn(dbClient, "columnInsert");
//     columnInsertSpy.mockResolvedValue(mockColumnInsertResponse);

//     createEmbeddingSpy.mockResolvedValue(mockCreateEmbeddingResponse);

//     await starpointOpenAiClient.buildAndInsertEmbeddings(mockRequest);

//     // check that mock returned an openai response
//     expect(createEmbeddingSpy).toHaveBeenCalled();

//     // check that starpoint column insert is called
//     expect(columnInsertSpy).toHaveBeenCalled();
//   });
// });

// describe("buildAndInsertEmbeddingsNoDefault", () => {
//   it("should return only an openai response and not a starpoint response", async () => {
//     const MOCK_COLLECTION_ID = uuid4();
//     const MOCK_API_KEY = uuid4();
//     const dbClient = db.initialize(MOCK_API_KEY);
//     const MOCK_OPENAI_KEY = uuid4();
//     const mockRequest: BuildAndInsertEmbeddingsFromOpenAIRequest = {
//       collection_id: MOCK_COLLECTION_ID,
//       model: "text-image-ada-002",
//       input_data: "this is test input",
//       document_metadata: [{ car: 2 }, { car: 1 }],
//     };
//     const starpointOpenAiClient = starpointOpenai.initialize(
//       MOCK_OPENAI_KEY,
//       dbClient
//     );
//     const columnInsertSpy = vi.spyOn(dbClient, "columnInsert");

//     await starpointOpenAiClient.buildAndInsertEmbeddingsNoDefault(mockRequest);
//     // check that mock returned an openai response
//     expect(createEmbeddingSpy).toHaveBeenCalled();

//     // check that starpoint column insert is not called;
//     expect(columnInsertSpy).not.toHaveBeenCalled();

//     columnInsertSpy.mockReset();
//     createEmbeddingSpy.mockReset();
//   });
// });
