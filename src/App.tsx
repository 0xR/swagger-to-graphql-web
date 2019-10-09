import React, { useRef, useState, useEffect, useCallback } from 'react';
import GraphiQL, { ToolbarButton } from 'graphiql';
import { graphql, GraphQLSchema } from 'graphql';
import GraphiQLExplorer from 'graphiql-explorer';
import dedent from 'dedent';
import { createSchema } from './schema';
import 'graphiql/graphiql.css';
import './App.css';
import ReactGA from 'react-ga';

ReactGA.initialize('UA-148987688-1', {
  debug: window.location.hostname === 'localhost',
});

const initialSwaggerSchema = 'https://petstore.swagger.io/v2/swagger.json';

const ChangeSchemaForm = ({
  onChangeSchema,
}: {
  onChangeSchema: (schema: GraphQLSchema) => void;
}) => {
  const [createSchemaState, setCreateSchemaState] = useState<
    'initial' | 'loading' | Error
  >('loading');
  const submitRef = useRef<HTMLInputElement | null>(null);

  const setUrl = useCallback(
    url =>
      createSchema(url).then(
        (schema: GraphQLSchema) => {
          ReactGA.event({
            category: 'Schema loading',
            action: 'Load success',
            label:
              url === initialSwaggerSchema ? 'default schema' : 'custom schema',
          });
          setCreateSchemaState('initial');
          onChangeSchema(schema);
        },
        (error: Error) => {
          ReactGA.event({
            category: 'Schema loading',
            action: 'Load fail',
            label:
              url === initialSwaggerSchema ? 'default schema' : 'custom schema',
          });
          setCreateSchemaState(error);
        },
      ),
    [setCreateSchemaState, onChangeSchema],
  );

  useEffect(() => {
    setUrl(initialSwaggerSchema);
  }, [setUrl]);

  return (
    <form
      className="changeSchemaForm"
      onSubmitCapture={e => {
        e.preventDefault();
        setCreateSchemaState('loading');
        const url: string = e.currentTarget.url.value;
        setUrl(url);
      }}
    >
      <input
        name="url"
        className="urlInput"
        placeholder={'Paste a swagger/openapi url here...'}
        defaultValue={initialSwaggerSchema}
      />
      <input type="submit" hidden ref={submitRef} />

      <ToolbarButton
        onClick={() => {
          submitRef.current && submitRef.current.click();
        }}
        title={'Fetches the Swagger/OpenAPI schema and converts it to GraphQL'}
        label={
          createSchemaState === 'loading' ? 'Update schema...' : 'Update schema'
        }
      />

      {createSchemaState instanceof Error && (
        <span className="changeSchemaFormError">{`Error: ${createSchemaState.message}`}</span>
      )}
    </form>
  );
};

const App: React.FC = () => {
  const [schemaState, setSchema] = useState<null | GraphQLSchema>(null);
  const [query, setQuery] = useState<string>(dedent`
    # To run the query: click the run button above
    # To edit the query: use the explorer on the left or edit the text below
    # To toggle autocomplete: press ctrl + space or cmd + space
    
    query PetInfo {
      findPetsByStatus(status: "sold") {
        id
        name
        category {
          name
        }
        tags {
          name
        }
      }
    }
  `);

  const graphiqlRef = useRef<any>();

  const [isExplorerOpen, setIsExplorerOpen] = useState<boolean>(true);

  return (
    <div className="graphiql-container">
      <GraphiQLExplorer
        schema={schemaState}
        query={query}
        onEdit={setQuery}
        onRunOperation={(operationName: string) =>
          graphiqlRef.current.handleRunQuery(operationName)
        }
        explorerIsOpen={isExplorerOpen}
        onToggleExplorer={() => setIsExplorerOpen(!isExplorerOpen)}
      />
      <GraphiQL
        ref={graphiqlRef}
        schema={schemaState}
        query={query}
        onEditQuery={setQuery}
        fetcher={async ({
          query,
          variables,
          operationName,
        }: {
          query: string;
          variables: { [key: string]: any };
          operationName?: string;
        }) => {
          if (schemaState) {
            try {
              const result = await graphql({
                schema: schemaState,
                source: query,
                variableValues: variables,
                operationName,
              });
              const hasErrors = result.errors && result.errors.length;
              ReactGA.event({
                category: 'query',
                action: 'execution success',
                label: hasErrors ? 'has errors' : 'no errors',
              });
              return result;
            } catch (e) {
              ReactGA.event({
                category: 'query',
                action: 'execution failed',
              });
              throw e;
            }
          }
        }}
      >
        <GraphiQL.Toolbar>
          <ChangeSchemaForm onChangeSchema={setSchema} />
          <ToolbarButton
            onClick={() => {
              graphiqlRef.current.handlePrettifyQuery();
            }}
            title="Prettify Query (Shift-Ctrl-P)"
            label="Prettify"
          />
          <ToolbarButton
            onClick={() => {
              graphiqlRef.current.handleToggleHistory();
            }}
            title="Show History"
            label="History"
          />
          <GraphiQL.Button
            onClick={() => setIsExplorerOpen(!isExplorerOpen)}
            label="Explorer"
            title="Toggle Explorer"
          />
        </GraphiQL.Toolbar>
      </GraphiQL>
    </div>
  );
};

export default App;
