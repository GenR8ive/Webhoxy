import { createSignal, createResource, For, Show, createEffect, createMemo } from "solid-js";
import { fieldApi, mappingApi } from "../lib/api";
import { FiTrash2, FiRefreshCw, FiSave, FiX, FiPlus, FiLink } from "solid-icons/fi";
import type { Mapping, FieldInfo } from "../lib/types";

interface MappingEditorProps {
  webhookId: number;
}

interface SourceField {
  path: string;
  type?: string;
  sample?: any;
}

interface TargetField {
  name: string;
  description: string;
  required: boolean;
}

interface FieldConnection {
  sourceFields: string[];
  separator?: string;
}

interface ServiceTemplate {
  name: string;
  description: string;
  icon: string;
  fields: TargetField[];
}

const SERVICE_TEMPLATES: ServiceTemplate[] = [
  {
    name: "Slack",
    description: "Slack incoming webhook",
    icon: "💬",
    fields: [
      { name: "text", description: "Main message text", required: true },
      { name: "username", description: "Bot username", required: false },
      { name: "icon_emoji", description: "Bot icon emoji", required: false },
      { name: "channel", description: "Target channel", required: false },
    ]
  },
  {
    name: "Discord",
    description: "Discord webhook",
    icon: "🎮",
    fields: [
      { name: "content", description: "Message content", required: true },
      { name: "username", description: "Webhook username", required: false },
      { name: "avatar_url", description: "Avatar URL", required: false },
    ]
  },
  {
    name: "Microsoft Teams",
    description: "Teams incoming webhook",
    icon: "👔",
    fields: [
      { name: "text", description: "Message text", required: true },
      { name: "title", description: "Message title", required: false },
      { name: "summary", description: "Summary text", required: false },
    ]
  },
  {
    name: "Telegram",
    description: "Telegram Bot API",
    icon: "✈️",
    fields: [
      { name: "text", description: "Message text", required: true },
      { name: "parse_mode", description: "Parse mode", required: false },
      { name: "disable_notification", description: "Silent message", required: false },
    ]
  }
];

function MappingEditor(props: MappingEditorProps) {
  const [mappings, { refetch }] = createResource(
    () => props.webhookId,
    (id) => mappingApi.list(id)
  );

  // Source fields
  const [sourceFields, setSourceFields] = createSignal<SourceField[]>([]);
  const [loadingFields, setLoadingFields] = createSignal(false);
  const [fieldsError, setFieldsError] = createSignal("");

  // Target fields
  const [targetFields, setTargetFields] = createSignal<TargetField[]>([]);
  const [selectedTemplate, setSelectedTemplate] = createSignal<string>("");

  // Connections
  const [connections, setConnections] = createSignal<Record<string, FieldConnection>>({});

  // Drag and drop state
  const [draggedSource, setDraggedSource] = createSignal<string | null>(null);
  const [draggedFromTarget, setDraggedFromTarget] = createSignal<string | null>(null); // Track source target for moving chips
  const [dragOverTarget, setDragOverTarget] = createSignal<string | null>(null);

  // UI state
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");
  const [initialLoadDone, setInitialLoadDone] = createSignal(false);

  // Group target fields by parent path (for JSON-like display)
  const groupedTargetFields = () => {
    const fields = targetFields();
    const groups: Record<string, TargetField[]> = {};
    
    fields.forEach(field => {
      const parts = field.name.split('.');
      
      if (parts.length === 1) {
        // Root level
        if (!groups['_root']) groups['_root'] = [];
        groups['_root'].push(field);
      } else {
        // Group by first part (e.g., "data", "user", "embeds")
        const groupName = parts[0];
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(field);
      }
    });
    
    return groups;
  };

  // Get fields from last log
  const handleGetFields = async () => {
    setLoadingFields(true);
    setFieldsError("");
    
    try {
      const fields = await fieldApi.getAvailableFields(props.webhookId);
      setSourceFields(fields.map(f => ({ path: f.path, type: f.type, sample: f.sample })));
    } catch (err: any) {
      setFieldsError(err.response?.data?.error || "No webhook logs found. Send a test webhook first.");
    } finally {
      setLoadingFields(false);
    }
  };

  // Manually add source field
  const handleAddSourceField = () => {
    const fieldPath = prompt("Enter source field path (e.g., 'user.name'):");
    if (fieldPath && fieldPath.trim()) {
      const newField: SourceField = { path: fieldPath.trim() };
      setSourceFields([...sourceFields(), newField]);
    }
  };

  // Remove source field
  const handleRemoveSourceField = (path: string) => {
    setSourceFields(sourceFields().filter(f => f.path !== path));
    
    // Remove from connections - create completely new objects
    const currentConnections = connections();
    const newConnections: Record<string, FieldConnection> = {};
    
    Object.keys(currentConnections).forEach((targetField) => {
      const filtered = currentConnections[targetField].sourceFields.filter(sf => sf !== path);
      if (filtered.length > 0) {
        newConnections[targetField] = {
          sourceFields: filtered,
          separator: currentConnections[targetField].separator
        };
      }
      // If no sources left, don't add to newConnections (effectively deletes it)
    });
    
    setConnections(newConnections);
  };

  // Apply template
  const handleApplyTemplate = (template: ServiceTemplate) => {
    setTargetFields(template.fields);
    setSelectedTemplate(template.name);
    setSuccess(`✅ ${template.name} template applied!`);
    setTimeout(() => setSuccess(""), 3000);
  };

  // Manually add target field
  const handleAddTargetField = () => {
    const fieldName = prompt("Enter target field name:");
    if (fieldName && fieldName.trim()) {
      const newField: TargetField = {
        name: fieldName.trim(),
        description: "Custom field",
        required: false
      };
      setTargetFields([...targetFields(), newField]);
    }
  };

  // Remove target field
  const handleRemoveTargetField = (fieldName: string) => {
    // Filter out the target field
    const updatedTargets = targetFields().filter(f => f.name !== fieldName);
    setTargetFields(updatedTargets);
    
    // Remove connections - create completely new object
    const currentConnections = connections();
    const newConnections: Record<string, FieldConnection> = {};
    
    Object.keys(currentConnections).forEach(key => {
      if (key !== fieldName) {
        newConnections[key] = {
          sourceFields: [...currentConnections[key].sourceFields],
          separator: currentConnections[key].separator
        };
      }
    });
    
    setConnections(newConnections);
    
    // Feedback
    setSuccess(`✅ Removed target field: ${fieldName}`);
    setTimeout(() => setSuccess(""), 2000);
  };

  // DRAG AND DROP HANDLERS
  const handleDragStart = (e: DragEvent, sourceFieldPath: string, fromTarget?: string) => {
    setDraggedSource(sourceFieldPath);
    if (fromTarget) {
      setDraggedFromTarget(fromTarget); // Track if dragging from a target (for moving)
    }
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "copy";
      e.dataTransfer.setData("text/plain", sourceFieldPath);
    }
  };

  const handleDragEnd = () => {
    setDraggedSource(null);
    setDraggedFromTarget(null);
    setDragOverTarget(null);
  };

  const handleDragOver = (e: DragEvent, targetFieldName: string) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
    setDragOverTarget(targetFieldName);
  };

  const handleDragLeave = (e: DragEvent) => {
    // Only clear if actually leaving the drop zone (not entering a child)
    const target = e.currentTarget as HTMLElement;
    const relatedTarget = e.relatedTarget as HTMLElement;
    
    if (!target.contains(relatedTarget)) {
      setDragOverTarget(null);
    }
  };

  const handleDrop = (e: DragEvent, targetFieldName: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const sourceFieldPath = draggedSource();
    const fromTarget = draggedFromTarget();
    
    if (!sourceFieldPath) return;

    // Create a completely new object to trigger reactivity
    const currentConnections = connections();
    const newConnections: Record<string, FieldConnection> = {};
    
    // Copy all existing connections
    Object.keys(currentConnections).forEach(key => {
      newConnections[key] = {
        sourceFields: [...currentConnections[key].sourceFields],
        separator: currentConnections[key].separator
      };
    });

    // If dragging from another target, remove it from there first
    if (fromTarget && fromTarget !== targetFieldName && newConnections[fromTarget]) {
      newConnections[fromTarget].sourceFields = newConnections[fromTarget].sourceFields.filter(
        sf => sf !== sourceFieldPath
      );
      // Remove target if no sources left
      if (newConnections[fromTarget].sourceFields.length === 0) {
        delete newConnections[fromTarget];
      }
    }

    // Add to the new target
    if (newConnections[targetFieldName]) {
      // Add source to existing connection if not already there
      if (!newConnections[targetFieldName].sourceFields.includes(sourceFieldPath)) {
        newConnections[targetFieldName].sourceFields = [
          ...newConnections[targetFieldName].sourceFields,
          sourceFieldPath
        ];
      }
    } else {
      // Create new connection
      newConnections[targetFieldName] = {
        sourceFields: [sourceFieldPath],
        separator: " "
      };
    }

    setConnections(newConnections);
    setDraggedSource(null);
    setDraggedFromTarget(null);
    setDragOverTarget(null);
    
    if (fromTarget && fromTarget !== targetFieldName) {
      setSuccess(`✅ Moved ${sourceFieldPath}: ${fromTarget} → ${targetFieldName}`);
    } else {
      setSuccess(`✅ Connected ${sourceFieldPath} → ${targetFieldName}`);
    }
    setTimeout(() => setSuccess(""), 2000);
  };

  // Remove specific source from target
  const handleRemoveSourceFromTarget = (targetField: string, sourceField: string) => {
    const currentConnections = connections();
    const newConnections: Record<string, FieldConnection> = {};
    
    // Create completely new object for reactivity
    Object.keys(currentConnections).forEach(key => {
      if (key === targetField) {
        const filtered = currentConnections[key].sourceFields.filter(sf => sf !== sourceField);
        if (filtered.length > 0) {
          newConnections[key] = {
            sourceFields: filtered,
            separator: currentConnections[key].separator
          };
        }
        // If no sources left, don't add (effectively deletes the connection)
      } else {
        newConnections[key] = {
          sourceFields: [...currentConnections[key].sourceFields],
          separator: currentConnections[key].separator
        };
      }
    });
    
    setConnections(newConnections);
    setSuccess(`✅ Removed ${sourceField} from ${targetField}`);
    setTimeout(() => setSuccess(""), 2000);
  };

  // Clear all connections for a target
  const handleClearTargetConnections = (targetField: string) => {
    const currentConnections = connections();
    const newConnections: Record<string, FieldConnection> = {};
    
    // Create completely new object for reactivity
    Object.keys(currentConnections).forEach(key => {
      if (key !== targetField) {
        newConnections[key] = {
          sourceFields: [...currentConnections[key].sourceFields],
          separator: currentConnections[key].separator
        };
      }
    });
    
    setConnections(newConnections);
  };

  // Change separator for multi-source connection
  const handleChangeSeparator = (targetField: string) => {
    const conn = connections()[targetField];
    if (!conn) return;

    const currentSep = conn.separator || " ";
    const displaySep = currentSep === "\n" ? "\\n (newline)" : 
                       currentSep === " " ? "(space)" : 
                       currentSep;
    
    const newSep = prompt(
      `Separator for joining fields:\n\nCurrent: ${displaySep}\n\nOptions:\n- Space: type "space" or leave empty\n- Newline: type "\\n"\n- Custom: any character(s)`,
      currentSep
    );
    
    if (newSep !== null) {
      const currentConnections = connections();
      const newConnections: Record<string, FieldConnection> = {};
      
      // Create completely new object for reactivity
      Object.keys(currentConnections).forEach(key => {
        if (key === targetField) {
          let separator = newSep;
          if (newSep === "" || newSep.toLowerCase() === "space") {
            separator = " ";
          } else if (newSep === "\\n" || newSep.toLowerCase() === "newline") {
            separator = "\n";
          }
          newConnections[key] = {
            sourceFields: [...currentConnections[key].sourceFields],
            separator: separator
          };
        } else {
          newConnections[key] = {
            sourceFields: [...currentConnections[key].sourceFields],
            separator: currentConnections[key].separator
          };
        }
      });
      
      setConnections(newConnections);
    }
  };

  // Save all mappings
  const handleSaveAll = async () => {
    const connCount = Object.keys(connections()).length;
    if (connCount === 0) {
      setError("No connections to save");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Delete existing mappings
      const existing = mappings();
      if (existing && existing.length > 0) {
        for (const mapping of existing) {
          await mappingApi.delete(mapping.id);
        }
      }

      // Create new mappings
      for (const [targetField, conn] of Object.entries(connections())) {
        let sourceFieldValue = "";
        
        if (conn.sourceFields.length === 1) {
          sourceFieldValue = conn.sourceFields[0];
        } else if (conn.sourceFields.length > 1) {
          // Multiple fields - store as JSON
          sourceFieldValue = JSON.stringify({
            fields: conn.sourceFields,
            separator: conn.separator || " "
          });
        }
        
        await mappingApi.create({
          webhook_id: props.webhookId,
          source_field: sourceFieldValue,
          target_field: targetField,
          fixed_value: null,
        });
      }

      setSuccess("✅ Mappings saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
      
      // Refetch from API but don't reset the initialLoadDone flag
      // This allows the user to continue editing without the effect overriding changes
      refetch();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save mappings");
    } finally {
      setSaving(false);
    }
  };

  // Load existing mappings ONCE on initial load only
  createEffect(() => {
    const existing = mappings();
    
    // Only load once, and only if we haven't loaded yet
    if (existing && existing.length > 0 && !initialLoadDone()) {
      const newConnections: Record<string, FieldConnection> = {};
      
      existing.forEach(m => {
        let sourceFields: string[] = [];
        let separator = " ";
        
        if (m.source_field) {
          try {
            const parsed = JSON.parse(m.source_field);
            if (parsed.fields && Array.isArray(parsed.fields)) {
              sourceFields = parsed.fields;
              separator = parsed.separator || " ";
            } else {
              sourceFields = [m.source_field];
            }
          } catch {
            sourceFields = [m.source_field];
          }
        }
        
        newConnections[m.target_field] = { sourceFields, separator };
      });

      setConnections(newConnections);

      // Load target fields
      if (targetFields().length === 0) {
        const targets = existing.map(m => ({
          name: m.target_field,
          description: "Existing field",
          required: false
        }));
        setTargetFields(targets);
      }
      
      // Mark as loaded so we don't reload and override user changes
      setInitialLoadDone(true);
    }
  });

  return (
    <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
      {/* Header */}
      <div class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-2xl font-bold text-slate-800">Field Mapping</h2>
          <div class="flex items-center space-x-2">
            <button
              onClick={handleSaveAll}
              disabled={saving() || Object.keys(connections()).length === 0}
              class="flex items-center space-x-2 bg-green-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSave class="w-4 h-4" />
              <span>{saving() ? "Saving..." : `Save ${Object.keys(connections()).length} Mapping${Object.keys(connections()).length !== 1 ? "s" : ""}`}</span>
            </button>
          </div>
        </div>
        <p class="text-slate-600 text-sm">
          🎯 <strong>Drag & Drop:</strong> Drag source fields from the left and drop them onto target fields on the right
        </p>
      </div>

      {/* Messages */}
      <Show when={error()}>
        <div class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error()}
        </div>
      </Show>

      <Show when={success()}>
        <div class="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success()}
        </div>
      </Show>

      <Show when={fieldsError()}>
        <div class="mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          <p class="font-medium">⚠️ {fieldsError()}</p>
        </div>
      </Show>

      {/* Service Templates */}
      <div class="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-5 border-2 border-indigo-200">
        <h3 class="font-bold text-slate-800 mb-3 flex items-center space-x-2">
          <span>🎯</span>
          <span>Quick Templates</span>
        </h3>
        
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <For each={SERVICE_TEMPLATES}>
            {(template) => (
              <button
                type="button"
                onClick={() => handleApplyTemplate(template)}
                class={`p-3 bg-white rounded-lg border-2 transition-all text-left hover:shadow-lg ${
                  selectedTemplate() === template.name
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-300 hover:border-blue-400"
                }`}
              >
                <div class="flex items-center space-x-2 mb-1">
                  <span class="text-xl">{template.icon}</span>
                  <span class="font-bold text-sm text-slate-800">{template.name}</span>
                </div>
                <div class="text-xs text-slate-500">{template.fields.length} fields</div>
              </button>
            )}
          </For>
        </div>
      </div>

      {/* Mapping Canvas - Two Columns */}
      <div class="bg-slate-50 rounded-lg border-2 border-slate-300 p-6">
        <div class="grid grid-cols-2 gap-8">
          
          {/* LEFT COLUMN - Source Fields */}
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-slate-700 flex items-center space-x-2">
                <span class="w-3 h-3 bg-green-500 rounded-full"></span>
                <span>Source Fields</span>
                <span class="text-xs text-slate-500">({sourceFields().length})</span>
              </h3>
              <div class="flex items-center space-x-2">
                <button
                  onClick={handleGetFields}
                  disabled={loadingFields()}
                  class="flex items-center space-x-1 text-xs bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                  title="Get fields from last log"
                >
                  <FiRefreshCw class={`w-3 h-3 ${loadingFields() ? "animate-spin" : ""}`} />
                  <span>Get Fields</span>
                </button>
                <button
                  onClick={handleAddSourceField}
                  class="flex items-center space-x-1 text-xs bg-green-500 text-white px-3 py-1.5 rounded hover:bg-green-600 transition-colors"
                  title="Add source field manually"
                >
                  <FiPlus class="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            <div class="space-y-2 max-h-[600px] overflow-y-auto overflow-x-hidden pr-2">
              <Show when={sourceFields().length === 0}>
                <div class="text-center py-12 text-slate-400">
                  <FiLink class="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p class="text-sm">No source fields yet</p>
                  <p class="text-xs mt-1">Click "Get Fields" or "Add" to start</p>
                </div>
              </Show>

              <For each={sourceFields()}>
                {(field) => {
                  // REACTIVE: Use createMemo for connections tracking
                  const connectedTargets = createMemo(() => {
                    const targets: string[] = [];
                    Object.entries(connections()).forEach(([targetField, conn]) => {
                      if (conn.sourceFields.includes(field.path)) {
                        targets.push(targetField);
                      }
                    });
                    return targets;
                  });
                  const isConnected = createMemo(() => connectedTargets().length > 0);
                  const isDragging = () => draggedSource() === field.path;
                  
                  // Extract the key name (last part of path)
                  const keyName = field.path.split('.').pop() || field.path;

                  return (
                    <div class="relative group">
                      <div
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, field.path)}
                        onDragEnd={handleDragEnd}
                        class={`w-full text-left p-3 rounded-lg border-2 transition-all cursor-grab active:cursor-grabbing ${
                          isDragging()
                            ? "opacity-50 scale-95 border-blue-600 bg-blue-100"
                            : isConnected()
                            ? "border-green-400 bg-green-50 hover:border-green-500 hover:shadow-md"
                            : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50 hover:shadow-md"
                        }`}
                      >
                        <div class="flex items-start justify-between gap-2">
                          <div class="flex-1 min-w-0">
                            {/* JSON-like key: value format */}
                            <div class="flex items-center space-x-1 flex-wrap">
                              <code class="text-xs font-mono font-bold text-purple-600">
                                "{keyName}":
                              </code>
                              <code class="text-xs font-mono text-slate-700">
                                {field.type === 'string' ? `"${JSON.stringify(field.sample || '').substring(1, 18)}..."` :
                                 field.type === 'number' ? (field.sample || '0') :
                                 field.type === 'boolean' ? String(field.sample) :
                                 field.type === 'object' ? '{ }' :
                                 field.type === 'array' ? '[ ]' :
                                 '...'}
                              </code>
                            </div>
                            <div class="flex items-center space-x-2 mt-0.5">
                              <Show when={field.type}>
                                <span class="text-xs text-slate-500 italic">// {field.type}</span>
                              </Show>
                              <code class="text-xs text-slate-400">{field.path}</code>
                            </div>
                            <Show when={isConnected()}>
                              <div class="mt-1.5 flex flex-wrap gap-1 border-t border-green-200 pt-1.5">
                                <For each={connectedTargets()}>
                                  {(target) => (
                                    <span class="text-xs px-2 py-0.5 bg-green-600 text-white rounded-full font-mono">
                                      → {target}
                                    </span>
                                  )}
                                </For>
                              </div>
                            </Show>
                          </div>
                          <Show when={isConnected()}>
                            <div class="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1"></div>
                          </Show>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveSourceField(field.path)}
                        class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full items-center justify-center hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 hidden group-hover:flex z-10"
                        title="Remove source field"
                      >
                        <FiX class="w-4 h-4" />
                      </button>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>

          {/* RIGHT COLUMN - Target Fields */}
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-slate-700 flex items-center space-x-2">
                <span class="w-3 h-3 bg-blue-500 rounded-full"></span>
                <span>Target Fields</span>
                <span class="text-xs text-slate-500">({targetFields().length})</span>
              </h3>
              <button
                onClick={handleAddTargetField}
                class="flex items-center space-x-1 text-xs bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 transition-colors"
                title="Add target field manually"
              >
                <FiPlus class="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>

            <div class="space-y-2 max-h-[600px] overflow-y-auto overflow-x-hidden pr-2">
              <Show when={targetFields().length === 0}>
                <div class="text-center py-12 text-slate-400">
                  <FiLink class="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p class="text-sm">No target fields yet</p>
                  <p class="text-xs mt-1">Select a template or click "Add"</p>
                </div>
              </Show>

              <For each={Object.entries(groupedTargetFields())}>
                {([groupName, fields]) => {
                  const groupConnections = fields.filter(f => {
                    const conn = connections()[f.name];
                    return conn && conn.sourceFields && conn.sourceFields.length > 0;
                  });

                  return (
                    <div class="space-y-1">
                      {/* Group Header - JSON Style */}
                      <div class="flex items-center space-x-2 p-2 bg-white border-2 border-blue-300 rounded-lg">
                        <code class="text-sm font-mono font-bold text-slate-800">
                          {groupName === '_root' ? '{ root }' : `"${groupName}": {`}
                        </code>
                        <span class="text-xs text-slate-500">({fields.length} fields)</span>
                        <Show when={groupConnections.length > 0}>
                          <span class="text-xs px-1.5 py-0.5 bg-blue-500 text-white rounded-full font-bold">
                            {groupConnections.length}
                          </span>
                        </Show>
                      </div>

                      {/* Group Fields - JSON Style */}
                      <div class="ml-6 space-y-2 border-l-2 border-blue-300 pl-3 py-2">
                        <For each={fields}>
                          {(field) => {
                            // REACTIVE: Use createMemo to ensure reactivity
                            const connection = createMemo(() => connections()[field.name]);
                            const hasConnection = createMemo(() => {
                              const conn = connection();
                              return conn && conn.sourceFields && conn.sourceFields.length > 0;
                            });
                            const isDropZone = () => dragOverTarget() === field.name;
                            const isDragActive = () => draggedSource() !== null;

                            // Extract the key name (last part of path)
                            const keyName = field.name.split('.').pop() || field.name;

                            return (
                              <div class="relative group">
                                <div
                                  onDragOver={(e) => handleDragOver(e, field.name)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDrop(e, field.name)}
                                  class={`p-3 rounded-lg border-2 transition-all duration-200 ease-in-out ${
                                    isDropZone()
                                      ? "border-green-500 bg-green-100 ring-4 ring-green-300 shadow-xl transform scale-[1.02]"
                                      : hasConnection()
                                      ? "border-blue-500 bg-blue-50"
                                      : isDragActive()
                                      ? "border-dashed border-blue-400 bg-blue-50"
                                      : "border-slate-300 bg-white"
                                  }`}
                                >
                                  <div class="flex items-center justify-between mb-2">
                                    <div class="flex items-center space-x-2">
                                      <Show when={hasConnection()}>
                                        <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                      </Show>
                                      <code class="text-xs font-mono font-bold text-purple-600">
                                        "{keyName}":
                                      </code>
                                      <code class="text-xs font-mono text-slate-700">
                                        {hasConnection() ? '[ ... ]' : '""'}
                                      </code>
                                      <Show when={field.required}>
                                        <span class="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-bold">
                                          required
                                        </span>
                                      </Show>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveTargetField(field.name);
                                      }}
                                      class="text-slate-400 hover:text-red-600 transition-colors"
                                      title="Remove target field"
                                    >
                                      <FiX class="w-4 h-4" />
                                    </button>
                                  </div>

                                  <p class="text-xs text-slate-500 mb-2 italic">// {field.description}</p>

                        {/* Drop zone area */}
                        <div class={`rounded border-2 border-dashed p-3 space-y-2 min-h-[80px] max-h-[300px] overflow-y-auto transition-all ${
                          isDropZone()
                            ? "border-green-500 bg-green-50"
                            : hasConnection()
                            ? "border-blue-300 bg-white"
                            : isDragActive()
                            ? "border-blue-400 bg-blue-50"
                            : "border-slate-300 bg-slate-50"
                        }`}>
                          <Show when={hasConnection()}>
                            <div class="space-y-1.5">
                              <For each={connection()?.sourceFields || []}>
                                {(sourceField) => {
                                  const isBeingDragged = draggedSource() === sourceField && draggedFromTarget() === field.name;
                                  
                                  return (
                                    <div 
                                      draggable={true}
                                      onDragStart={(e) => handleDragStart(e, sourceField, field.name)}
                                      onDragEnd={handleDragEnd}
                                      class={`flex items-center justify-between bg-green-50 rounded px-2 py-1.5 border border-green-200 transition-all duration-150 cursor-grab active:cursor-grabbing hover:shadow-md hover:bg-green-100 ${
                                        isBeingDragged ? "opacity-50 scale-95" : ""
                                      }`}
                                    >
                                      <div class="flex items-center space-x-2 flex-1 min-w-0">
                                        <span class="text-xs flex-shrink-0">🔗</span>
                                        <code class="text-xs font-mono text-green-700 truncate flex-1">
                                          {sourceField}
                                        </code>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveSourceFromTarget(field.name, sourceField);
                                        }}
                                        class="ml-2 flex-shrink-0 text-red-500 hover:text-red-700 transition-colors"
                                        title="Remove this connection"
                                      >
                                        <FiX class="w-3 h-3" />
                                      </button>
                                    </div>
                                  );
                                }}
                              </For>
                            </div>

                            {/* Separator controls */}
                            <Show when={(connection()?.sourceFields.length || 0) > 1}>
                              <div class="flex items-center justify-between pt-2 border-t border-blue-200">
                                <div class="flex items-center space-x-2">
                                  <span class="text-xs text-slate-600">Join with:</span>
                                  <code class="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                                    {connection()?.separator === "\n" ? "\\n" : 
                                     connection()?.separator === " " ? "(space)" :
                                     connection()?.separator || " "}
                                  </code>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleChangeSeparator(field.name);
                                  }}
                                  class="text-xs text-blue-600 hover:text-blue-800 underline"
                                >
                                  Change
                                </button>
                              </div>
                            </Show>

                            {/* Clear all button */}
                            <div class="flex justify-end pt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClearTargetConnections(field.name);
                                }}
                                class="text-xs text-red-500 hover:text-red-700 flex items-center space-x-1"
                                title="Clear all connections"
                              >
                                <FiTrash2 class="w-3 h-3" />
                                <span>Clear all</span>
                              </button>
                            </div>
                          </Show>

                          {/* Drop zone message */}
                          <Show when={!hasConnection()}>
                            <div class="flex flex-col items-center justify-center py-4 text-center">
                              <Show when={isDropZone()} fallback={
                                <div class="text-slate-400 text-xs">
                                  {isDragActive() ? (
                                    <>
                                      <span class="text-2xl mb-2 block">⬇️</span>
                                      <span class="font-medium">Drop here to connect</span>
                                    </>
                                  ) : (
                                    <>
                                      <span class="text-2xl mb-2 block opacity-50">📥</span>
                                      <span>Drag sources here</span>
                                    </>
                                  )}
                                </div>
                              }>
                                <span class="text-2xl mb-2 block animate-bounce">⬇️</span>
                                <span class="text-green-700 font-bold text-sm">Drop to connect!</span>
                              </Show>
                            </div>
                                  </Show>
                                </div>
                              </div>
                            </div>
                          );
                        }}
                      </For>
                      {/* Closing brace */}
                      <div class="text-xs font-mono text-slate-500 pl-2">
                        {'}'}
                      </div>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
        </div>

        {/* Drag indicator at bottom */}
        <Show when={draggedSource()}>
          <div class="mt-6 bg-gradient-to-r from-purple-100 to-blue-200 border-2 border-purple-400 rounded-lg p-4 text-center">
            <p class="text-purple-900 font-bold flex items-center justify-center space-x-2">
              <span class="text-xl animate-pulse">🎯</span>
              <span>Dragging:</span>
              <code class="font-mono bg-white px-3 py-1 rounded shadow">{draggedSource()}</code>
              <span class="text-xl animate-bounce">➡️</span>
            </p>
            <p class="text-purple-700 text-sm mt-2">
              Drop onto a target field to create a connection
            </p>
          </div>
        </Show>
      </div>
    </div>
  );
}

export default MappingEditor;
