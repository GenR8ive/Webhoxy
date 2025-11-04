import JsonMappingEditor from "./JsonMappingEditor";

interface MappingEditorProps {
  webhookId: number;
}

function MappingEditor(props: MappingEditorProps) {
  return <JsonMappingEditor webhookId={props.webhookId} />;
}

export default MappingEditor;
