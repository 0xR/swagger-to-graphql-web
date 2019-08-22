import {
  createSchema as createSchemaFromSwagger,
  CallBackendArguments
} from 'swagger-to-graphql';

// @ts-ignore
export const createSchema = (url: string) =>
  createSchemaFromSwagger({
    swaggerSchema: url,
    async callBackend({
      requestOptions: { method, body, baseUrl, path, query, headers, bodyType }
    }: CallBackendArguments<{}>) {
      const hasBody = Object.keys(body).length > 0;
      const response = await fetch(
        `https://cors-anywhere.herokuapp.com/${baseUrl}${path}?${new URLSearchParams(
          query
        )}`,
        {
          method,
          ...(bodyType === 'json' && {
            headers: {
              'Content-Type': 'application/json',
              ...headers
            },
            body: hasBody ? JSON.stringify(body) : undefined
          }),
          ...(bodyType === 'formData' && {
            headers: headers,
            body: hasBody ? new URLSearchParams(body) : undefined
          })
        }
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
  });
