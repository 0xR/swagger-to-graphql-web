import requestPromise from "request-promise";
import {
  createSchema as createSchemaFromSwagger,
  CallBackendArguments
} from "swagger-to-graphql";

// @ts-ignore
export const createSchema = (url: string) =>
  createSchemaFromSwagger({
    swaggerSchema: url,
    async callBackend({
      requestOptions: { method, body, baseUrl, path, query, headers, bodyType }
    }: CallBackendArguments<{}>) {
      return requestPromise({
        ...(bodyType === "json" && {
          json: true,
          body
        }),
        ...(bodyType === "formData" && {
          form: body
        }),
        qs: query,
        method,
        headers,
        baseUrl: `https://cors-anywhere.herokuapp.com/${baseUrl}`,
        uri: path
      });
    }
  });
