import { CreateEmbeddingRequestInput } from "openai";
import { APIResult } from "starpoint";
import ky from "ky-universal"

export const backfillDocumentMetadata = (
  inputData: CreateEmbeddingRequestInput
) => {
  if (typeof inputData === "string") {
    return [{ input: inputData }];
  } else {
    return inputData.map((data) => {
      return {
        input: data,
      };
    });
  }
};

export const handleError = async (err: any): Promise<APIResult<null>> => {
  if (err.name === "HTTPError") {
    return {
      data: null,
      error: await err.response.json(),
    };
  }
  return {
    data: null,
    error: { error_message: err.message },
  };
};

