import {
  createSchema as createSchemaFromSwagger,
  CallBackendArguments,
} from 'swagger-to-graphql';
import { safeLoad } from 'js-yaml';

function getBodyAndHeaders(
  body: any,
  bodyType: 'json' | 'formData',
  headers: { [key: string]: string } | undefined,
) {
  if (!body) {
    return { headers };
  }

  if (bodyType === 'json') {
    return {
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    };
  }

  return {
    headers,
    body: new URLSearchParams(body),
  };
}

async function callBackend({
  requestOptions: { method, body, baseUrl, path, query, headers, bodyType },
}: CallBackendArguments<{}>) {
  const searchPath = query ? `?${new URLSearchParams(query as Record<string,string>)}` : '';
  const url = `https://cors-anywhere.herokuapp.com/${baseUrl}${path}${searchPath}`;
  const bodyAndHeaders = getBodyAndHeaders(body, bodyType, headers);
  const response = await fetch(url, {
    method,
    ...bodyAndHeaders,
  });

  const text = await response.text();
  if (response.ok) {
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

  const parsedSchema =
    typeof swaggerSchema === 'string' ? safeLoad(swaggerSchema) : swaggerSchema;

  return createSchemaFromSwagger({
    swaggerSchema: parsedSchema,
    callBackend,
  });
};
