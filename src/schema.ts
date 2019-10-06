import {
  createSchema as createSchemaFromSwagger,
  CallBackendArguments,
} from 'swagger-to-graphql';
import { safeLoad } from 'js-yaml';

async function callBackend({
  requestOptions: { method, body, baseUrl, path, query, headers, bodyType },
}: CallBackendArguments<{}>) {
  const response = await fetch(
    `https://cors-anywhere.herokuapp.com/${baseUrl}${path}?${new URLSearchParams(
      // Typedefs seem wrong
      query as Record<string, string>,
    )}`,
    {
      method,
      ...(bodyType === 'json' && {
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      }),
      ...(bodyType === 'formData' && {
        headers: headers,
        body: body ? new URLSearchParams(body) : undefined,
      }),
    },
  );

  const text = await response.text();
  if (200 <= response.status && response.status < 300) {
    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  }
  throw new Error(`Response: ${response.status} - ${text}`);
}
export const createSchema = async (url: string) => {
  const swaggerSchema = await callBackend({
    context: {},
    requestOptions: {
      method: 'get',
      baseUrl: url,
      path: '',
      bodyType: 'json',
    },
  });

  const parsedSchema = typeof swaggerSchema === 'string' ? safeLoad(swaggerSchema) : swaggerSchema;

  return createSchemaFromSwagger({
    swaggerSchema: parsedSchema,
    callBackend,
  });
};
