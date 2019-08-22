import React, { useRef, useState } from 'react';
import GraphiQL, { ToolbarButton } from 'graphiql';
import { graphql, GraphQLSchema } from 'graphql';
import { createSchema } from './schema';
import './App.css';

const ChangeSchemaForm = ({
  onChangeSchema
}: {
  onChangeSchema: (schema: GraphQLSchema) => void;
}) => {
  const [createSchemaState, setCreateSchemaState] = useState<
    'initial' | 'loading' | Error
  >('initial');
  const submitRef = useRef<HTMLInputElement | null>(null);
  return (
    <form
      className="changeSchemaForm"
      onSubmitCapture={e => {
        e.preventDefault();
        setCreateSchemaState('loading');
        const url: string = e.currentTarget.url.value;
        createSchema(url).then(
          (schema: GraphQLSchema) => {
            setCreateSchemaState('initial');
            onChangeSchema(schema);
          },
          (error: Error) => setCreateSchemaState(error)
        );
      }}
    >
      <input
        name="url"
        className="urlInput"
        placeholder={'Paste a swagger/openapi url here...'}
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
      ></ToolbarButton>

      {createSchemaState instanceof Error && (
        <span className="changeSchemaFormError">{`Error: ${createSchemaState.message}`}</span>
      )}
    </form>
  );
};

const App: React.FC = () => {
  const [schemaState, setSchema] = useState<null | GraphQLSchema>(null);

  const graphiqlRef = useRef<any>();

  if (schemaState instanceof Error) {
    return <pre>{`Got error: ${schemaState.message}`}</pre>;
  }
  return (
    <GraphiQL
      ref={graphiqlRef}
      schema={schemaState}
      fetcher={({
        query,
        variables
      }: {
        query: string;
        variables: { [key: string]: any };
      }) => {
        if (schemaState) {
          return graphql(schemaState, query, variables);
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
            graphiqlRef.current.handleMergeQuery();
          }}
          title="Merge Query (Shift-Ctrl-M)"
          label="Merge"
        />
        <ToolbarButton
          onClick={() => {
            graphiqlRef.current.handleCopyQuery();
          }}
          title="Copy Query (Shift-Ctrl-C)"
          label="Copy"
        />
        <ToolbarButton
          onClick={() => {
            graphiqlRef.current.handleToggleHistory();
          }}
          title="Show History"
          label="History"
        />
      </GraphiQL.Toolbar>
    </GraphiQL>
  );
};

export default App;
