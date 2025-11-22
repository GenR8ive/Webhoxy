import { createSignal, createResource, For, Show, createEffect, onMount, onCleanup } from "solid-js";
import { fieldApi, mappingApi } from "../lib/api";
import { FiRefreshCw, FiSave, FiPlus, FiCopy, FiCheck } from "solid-icons/fi";
import type { Mapping } from "../lib/types";

import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine, KeyBinding, Decoration, DecorationSet, WidgetType, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { EditorState, Compartment, RangeSetBuilder } from "@codemirror/state";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { linter, lintGutter } from "@codemirror/lint";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { search, highlightSelectionMatches } from "@codemirror/search";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { syntaxTree } from "@codemirror/language";

interface JsonMappingEditorProps {
  webhookId: number;
}

interface SourceField {
  path: string;
  type?: string;
  sample?: any;
}

interface AutocompleteState {
  show: boolean;
  x: number;
  y: number;
  cursorPosition: number;
  searchTerm: string;
}

// Custom widget for variable chips
class VariableChipWidget extends WidgetType {
  constructor(readonly fieldName: string, readonly from: number, readonly to: number) {
    super();
  }

  toDOM(view: EditorView) {
    const chip = document.createElement("span");
    chip.className = "variable-chip";
    chip.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      margin: 0 2px;
      background: linear-gradient(135deg, #d946ef 0%, #8b5cf6 100%);
      color: white;
      border-radius: 4px;
      font-size: 0.85em;
      font-weight: 600;
      font-family: monospace;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      transition: all 0.2s;
      user-select: none;
    `;
    chip.textContent = this.fieldName;
    chip.title = `Variable: ${this.fieldName}\nClick to select • Press Escape to delete`;
    
    // Handle click to select the variable
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      view.dispatch({
        selection: { anchor: this.from, head: this.to }
      });
      view.focus();
    });
    
    return chip;
  }

  ignoreEvent(e: Event) {
    return e.type === 'mousedown' || e.type === 'click';
  }
}

// Find and decorate all {{...}} patterns
function createVariableDecorations(view: EditorView) {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;
  const text = doc.toString();
  const regex = /\{\{([^}]+)\}\}/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const from = match.index;
    const to = match.index + match[0].length;
    const fieldName = match[1];
    
    builder.add(
      from,
      to,
      Decoration.replace({
        widget: new VariableChipWidget(fieldName, from, to)
      })
    );
  }

  return builder.finish();
}

// View plugin to manage decorations
const variableChipPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = createVariableDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = createVariableDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations
  }
);

function JsonMappingEditor(props: JsonMappingEditorProps) {
  const [mappings, { refetch }] = createResource(
    () => props.webhookId,
    (id) => mappingApi.list(id)
  );

  // Source fields
  const [sourceFields, setSourceFields] = createSignal<SourceField[]>([]);
  const [loadingFields, setLoadingFields] = createSignal(false);
  const [fieldsError, setFieldsError] = createSignal("");

  // JSON editor
  const [jsonValue, setJsonValue] = createSignal("{\n  \n}");
  let editorContainerRef: HTMLDivElement | undefined;
  let editorView: EditorView | undefined;

  // Autocomplete state
  const [autocomplete, setAutocomplete] = createSignal<AutocompleteState>({
    show: false,
    x: 0,
    y: 0,
    cursorPosition: 0,
    searchTerm: ""
  });
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = createSignal(0);

  // UI state
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  // Get filtered suggestions
  const filteredSuggestions = () => {
    const search = autocomplete().searchTerm.toLowerCase();
    return sourceFields().filter(f => 
      f.path.toLowerCase().includes(search)
    );
  };

  // Check if we should show "Add field" option
  const shouldShowAddField = () => {
    const search = autocomplete().searchTerm.trim();
    return search.length > 0 && filteredSuggestions().length === 0;
  };

  // Add custom field
  const addCustomField = async (fieldPath: string) => {
    const trimmed = fieldPath.trim();
    if (!trimmed) return;

    // Check if field already exists
    const exists = sourceFields().some(f => f.path === trimmed);
    if (!exists) {
      setSourceFields([...sourceFields(), { path: trimmed, type: 'custom' }]);
      
      // Save custom field to database
      try {
        await fieldApi.saveCustomField(props.webhookId, trimmed);
        setSuccess(`✅ Added custom field: ${trimmed}`);
        setTimeout(() => setSuccess(""), 2000);
      } catch (err) {
        console.error('Failed to save custom field:', err);
      }
    }

    // Insert the field
    insertSourceField(trimmed);
  };

  // Load stored fields (from database)
  const loadStoredFields = async () => {
    try {
      const fields = await fieldApi.getStoredFields(props.webhookId);
      if (fields.length > 0) {
        setSourceFields(fields.map(f => ({ path: f.path, type: f.type, sample: f.sample })));
      }
    } catch (err) {
      console.error('Failed to load stored fields:', err);
    }
  };

  // Get fields from last log (and save them)
  const handleGetFields = async () => {
    setLoadingFields(true);
    setFieldsError("");
    
    try {
      const fields = await fieldApi.getAvailableFields(props.webhookId);
      setSourceFields(fields.map(f => ({ path: f.path, type: f.type, sample: f.sample })));
      setSuccess("✅ Source fields loaded from webhook!");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err: any) {
      setFieldsError(err.response?.data?.error || "No webhook logs found. Send a test webhook first.");
    } finally {
      setLoadingFields(false);
    }
  };



  // Beautify JSON
  const handleBeautify = () => {
    try {
      const currentValue = editorView?.state.doc.toString() || jsonValue();
      const parsed = JSON.parse(currentValue);
      const formatted = JSON.stringify(parsed, null, 2);
      
      if (editorView) {
        editorView.dispatch({
          changes: { from: 0, to: editorView.state.doc.length, insert: formatted }
        });
      }
      setSuccess("✅ JSON beautified!");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err: any) {
      setError("❌ Invalid JSON: " + err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  // Handle editor input
  const handleEditorUpdate = (value: string, cursorPos: number) => {
    // Check if we should show autocomplete
    const beforeCursor = value.substring(0, cursorPos);
    const lastAt = beforeCursor.lastIndexOf('@');
    
    if (lastAt !== -1 && lastAt === cursorPos - 1) {
      // Just typed @
      showAutocomplete(cursorPos);
    } else if (autocomplete().show && lastAt !== -1) {
      // Update search term if autocomplete is already open
      const searchTerm = beforeCursor.substring(lastAt + 1);
      
      // Check if we're still after the @
      if (!searchTerm.includes(' ') && !searchTerm.includes('\n')) {
        setAutocomplete(prev => ({ ...prev, searchTerm, cursorPosition: cursorPos }));
        setSelectedSuggestionIndex(0);
      } else {
        hideAutocomplete();
      }
    } else if (autocomplete().show) {
      hideAutocomplete();
    }
  };

  // Show autocomplete popup
  const showAutocomplete = (cursorPos: number) => {
    if (!editorView || !editorContainerRef) return;
    
    const coords = editorView.coordsAtPos(cursorPos);
    if (!coords) return;
    
    setAutocomplete({
      show: true,
      x: coords.left,
      y: coords.bottom,
      cursorPosition: cursorPos,
      searchTerm: ""
    });
    setSelectedSuggestionIndex(0);
  };

  // Hide autocomplete
  const hideAutocomplete = () => {
    setAutocomplete(prev => ({ ...prev, show: false }));
  };

  // Insert source field at cursor
  const insertSourceField = (fieldPath: string) => {
    if (!editorView) return;

    const value = editorView.state.doc.toString();
    const cursorPos = editorView.state.selection.main.head;
    const beforeCursor = value.substring(0, cursorPos);

    // Find the @ symbol position
    const lastAt = beforeCursor.lastIndexOf('@');
    
    if (lastAt !== -1) {
      const insertText = `{{${fieldPath}}}`;
      editorView.dispatch({
        changes: { from: lastAt, to: cursorPos, insert: insertText },
        selection: { anchor: lastAt + insertText.length }
      });
      editorView.focus();
    }

    hideAutocomplete();
  };

  // Handle autocomplete selection
  const handleAutocompleteSelect = () => {
    const suggestions = filteredSuggestions();
    const hasAddOption = shouldShowAddField();
    
    if (hasAddOption && selectedSuggestionIndex() === suggestions.length) {
      // User selected "Add field" option
      addCustomField(autocomplete().searchTerm);
    } else if (suggestions.length > 0 && selectedSuggestionIndex() < suggestions.length) {
      // User selected an existing field
      insertSourceField(suggestions[selectedSuggestionIndex()].path);
    }
    return true;
  };

  // Scroll selected item into view
  const scrollSelectedIntoView = () => {
    setTimeout(() => {
      const popup = document.querySelector('.autocomplete-popup');
      if (!popup) return;
      
      const selectedItem = popup.querySelector('.autocomplete-item-selected');
      if (selectedItem) {
        selectedItem.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }, 0);
  };

  // Delete variable chip at cursor
  const deleteVariableAtCursor = (view: EditorView): boolean => {
    const pos = view.state.selection.main.head;
    const doc = view.state.doc;
    const text = doc.toString();
    
    // Find if cursor is inside or adjacent to a {{...}} pattern
    const beforeCursor = text.substring(0, pos);
    const afterCursor = text.substring(pos);
    
    // Find the closest {{ before cursor
    const lastOpenIndex = beforeCursor.lastIndexOf('{{');
    if (lastOpenIndex === -1) return false;
    
    // Find the next }} after that {{
    const textAfterOpen = text.substring(lastOpenIndex);
    const closeMatch = textAfterOpen.match(/\}\}/);
    if (!closeMatch) return false;
    
    const closeIndex = lastOpenIndex + closeMatch.index! + 2;
    
    // Check if cursor is within this variable
    if (pos >= lastOpenIndex && pos <= closeIndex) {
      view.dispatch({
        changes: { from: lastOpenIndex, to: closeIndex, insert: "" },
        selection: { anchor: lastOpenIndex }
      });
      return true;
    }
    
    return false;
  };

  // Create custom keymap for autocomplete
  const createAutocompleteKeymap = (): KeyBinding[] => {
    return [
      {
        key: "ArrowDown",
        run: () => {
          if (!autocomplete().show) return false;
          
          const suggestions = filteredSuggestions();
          const hasAddOption = shouldShowAddField();
          const totalOptions = suggestions.length + (hasAddOption ? 1 : 0);
          
          setSelectedSuggestionIndex(prev => {
            const newIndex = Math.min(prev + 1, totalOptions - 1);
            scrollSelectedIntoView();
            return newIndex;
          });
          return true; // Prevent default
        }
      },
      {
        key: "ArrowUp",
        run: () => {
          if (!autocomplete().show) return false;
          
          setSelectedSuggestionIndex(prev => {
            const newIndex = Math.max(prev - 1, 0);
            scrollSelectedIntoView();
            return newIndex;
          });
          return true; // Prevent default
        }
      },
      {
        key: "Enter",
        run: () => {
          if (!autocomplete().show) return false;
          return handleAutocompleteSelect();
        }
      },
      {
        key: "Tab",
        run: () => {
          if (!autocomplete().show) return false;
          return handleAutocompleteSelect();
        }
      },
      {
        key: "Escape",
        run: (view) => {
          if (autocomplete().show) {
            hideAutocomplete();
            return true;
          }
          // If no autocomplete, try to delete variable at cursor
          return deleteVariableAtCursor(view);
        }
      },
      {
        key: "Backspace",
        run: (view) => {
          // Try to delete variable chip when backspacing into it
          const pos = view.state.selection.main.head;
          if (pos === 0) return false;
          
          const doc = view.state.doc;
          const text = doc.toString();
          const charBefore = text[pos - 1];
          
          // If backspacing right after }}, delete the whole variable
          if (charBefore === '}' && text[pos - 2] === '}') {
            return deleteVariableAtCursor(view);
          }
          
          return false;
        }
      }
    ];
  };

  // Click outside to close autocomplete
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.autocomplete-popup')) {
      hideAutocomplete();
    }
  };

  onMount(() => {
    document.addEventListener('click', handleClickOutside);

    // Load stored source fields
    loadStoredFields();

    // Initialize CodeMirror editor
    if (editorContainerRef) {
      const startState = EditorState.create({
        doc: jsonValue(),
        extensions: [
          vscodeDark,
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          json(),
          linter(jsonParseLinter()),
          lintGutter(),
          search(),
          highlightSelectionMatches(),
          variableChipPlugin,
          keymap.of([...createAutocompleteKeymap(), ...defaultKeymap, indentWithTab]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const value = update.state.doc.toString();
              const cursorPos = update.state.selection.main.head;
              handleEditorUpdate(value, cursorPos);
            }
          }),
          EditorView.theme({
            "&": { height: "600px" },
            ".cm-scroller": { overflow: "auto" },
            ".cm-content": { fontFamily: "monospace" },
            ".variable-chip:hover": { 
              transform: "scale(1.05)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.4)"
            }
          })
        ]
      });

      editorView = new EditorView({
        state: startState,
        parent: editorContainerRef
      });
    }
  });

  onCleanup(() => {
    document.removeEventListener('click', handleClickOutside);
    if (editorView) {
      editorView.destroy();
    }
  });

  // Save mapping
  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const currentValue = editorView?.state.doc.toString() || jsonValue();
      
      // Parse JSON to validate
      const parsedJson = JSON.parse(currentValue);
      
      // Delete existing mappings
      const existing = mappings();
      if (existing && existing.length > 0) {
        for (const mapping of existing) {
          await mappingApi.delete(mapping.id);
        }
      }

      // Save the JSON template - store in fixed_value to preserve it
      await mappingApi.create({
        webhook_id: props.webhookId,
        source_field: JSON.stringify(parsedJson), // Store parsed JSON
        target_field: "_json_editor",
        fixed_value: currentValue // Store raw template for editing
      });

      setSuccess("✅ JSON mapping saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
      refetch();
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError("❌ Invalid JSON syntax: " + err.message);
      } else {
        setError(err.response?.data?.message || "Failed to save mapping");
      }
    } finally {
      setSaving(false);
    }
  };

  // Copy source field to clipboard
  const copyFieldReference = (fieldPath: string) => {
    navigator.clipboard.writeText(`{{${fieldPath}}}`);
    setSuccess(`✅ Copied {{${fieldPath}}}`);
    setTimeout(() => setSuccess(""), 2000);
  };

  // Load existing JSON template (only once when mappings are loaded)
  let mappingsLoaded = false;
  createEffect(() => {
    const existing = mappings();
    if (existing && existing.length > 0 && !mappingsLoaded) {
      const jsonMapping = existing.find(m => m.target_field === "_json_editor");
      if (jsonMapping && jsonMapping.fixed_value && editorView) {
        const currentContent = editorView.state.doc.toString();
        // Only update if the content is different and not the default empty object
        if (currentContent === "{\n  \n}" || currentContent === "") {
          editorView.dispatch({
            changes: { from: 0, to: editorView.state.doc.length, insert: jsonMapping.fixed_value }
          });
          mappingsLoaded = true;
        }
      }
    }
  });

  return (
    <div class="glass-card rounded-xl p-6">
      {/* Header */}
      <div class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-2xl font-bold text-white">JSON Mapping Editor</h2>
          <div class="flex items-center space-x-3">
            <button
              onClick={handleBeautify}
              class="flex items-center space-x-2 bg-primary-600/20 text-primary-300 font-bold py-2 px-4 rounded-lg hover:bg-primary-600/30 transition-colors cursor-pointer border border-primary-500/20"
            >
              <FiCheck class="w-4 h-4" />
              <span>Beautify</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving()}
              class="flex items-center space-x-2 btn-primary text-white font-bold py-2 px-5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <FiSave class="w-4 h-4" />
              <span>{saving() ? "Saving..." : "Save Mapping"}</span>
            </button>
          </div>
        </div>
        <p class="text-slate-400 text-sm">
          ✨ Type <code class="bg-white/10 px-2 py-0.5 rounded text-xs text-slate-300">@</code> to insert source fields as chips. Click a chip to select it, then press <kbd class="bg-white/10 text-slate-300 px-1.5 py-0.5 rounded text-xs">Esc</kbd> to delete.
        </p>
      </div>

      {/* Messages */}
      <Show when={error()}>
        <div class="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error()}
        </div>
      </Show>

      <Show when={success()}>
        <div class="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg text-sm">
          {success()}
        </div>
      </Show>

      <Show when={fieldsError()}>
        <div class="mb-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-3 rounded-lg text-sm">
          <p class="font-medium">⚠️ {fieldsError()}</p>
        </div>
      </Show>



      <div class="grid grid-cols-12 gap-6">
        {/* Source Fields Panel */}
        <div class="col-span-4">
          <div class="bg-black/20 rounded-lg border border-white/10 p-4 sticky top-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-bold text-slate-300 text-sm">Source Fields</h3>
              <button
                onClick={handleGetFields}
                disabled={loadingFields()}
                class="flex items-center space-x-1 text-xs bg-primary-500/20 text-primary-300 px-2 py-1 rounded hover:bg-primary-500/30 transition-colors disabled:opacity-50 cursor-pointer border border-primary-500/20"
              >
                <FiRefreshCw class={`w-3 h-3 ${loadingFields() ? "animate-spin" : ""}`} />
                <span>Get Fields</span>
              </button>
            </div>

            <div class="space-y-1 max-h-[600px] overflow-y-auto custom-scrollbar">
              <Show when={sourceFields().length === 0}>
                <p class="text-xs text-slate-500 text-center py-4">
                  No fields yet. Click "Get Fields" to load from last webhook log.
                </p>
              </Show>

              <For each={sourceFields()}>
                {(field) => {
                  const formatSample = (sample: any, type?: string) => {
                    if (sample === null || sample === undefined) return 'null';
                    if (type === 'string') return `"${String(sample).substring(0, 30)}${String(sample).length > 30 ? '...' : ''}"`;
                    if (type === 'number') return String(sample);
                    if (type === 'boolean') return String(sample);
                    if (type === 'object') return '{ ... }';
                    if (type === 'array') return '[ ... ]';
                    return JSON.stringify(sample).substring(0, 30);
                  };

                  return (
                    <div class="group relative bg-white/5 p-2 rounded border border-white/5 hover:border-primary-500/30 transition-all hover:bg-white/10">
                      <div class="flex items-start justify-between gap-2">
                        <div class="flex-1 min-w-0">
                          <code class="text-xs font-mono font-bold text-primary-400 block truncate">
                            {field.path}
                          </code>
                          <div class="flex items-center space-x-2 mt-0.5">
                            <Show when={field.type}>
                              <span class="text-xs text-slate-500 italic">{field.type}</span>
                            </Show>
                            <Show when={field.sample !== undefined && field.sample !== null}>
                              <span class="text-xs text-slate-600">•</span>
                              <code class="text-xs text-slate-400 font-mono truncate">
                                {formatSample(field.sample, field.type)}
                              </code>
                            </Show>
                          </div>
                        </div>
                        <button
                          onClick={() => copyFieldReference(field.path)}
                          class="opacity-0 group-hover:opacity-100 text-primary-400 hover:text-primary-300 transition-all cursor-pointer flex-shrink-0"
                          title="Copy reference"
                        >
                          <FiCopy class="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        </div>

        {/* JSON Editor Panel */}
        <div class="col-span-8">
          <div class="bg-black/20 rounded-lg border border-white/10 p-4">
            <h3 class="font-bold text-slate-300 mb-3 text-sm">Target JSON</h3>
            
            <div class="relative">
              <div 
                ref={editorContainerRef}
                class="border border-white/10 rounded-lg overflow-hidden shadow-inner"
              />

              {/* Autocomplete Popup */}
              <Show when={autocomplete().show}>
                <div
                  class="autocomplete-popup fixed bg-slate-800 border border-primary-500/30 rounded-lg shadow-2xl max-h-64 overflow-y-auto z-50"
                  style={{
                    top: `${autocomplete().y}px`,
                    left: `${autocomplete().x}px`,
                    "min-width": "280px"
                  }}
                >
                  {/* Existing field suggestions */}
                  <For each={filteredSuggestions()}>
                    {(field, index) => {
                      const formatSample = (sample: any, type?: string) => {
                        if (sample === null || sample === undefined) return null;
                        if (type === 'string') return `"${String(sample).substring(0, 25)}${String(sample).length > 25 ? '...' : ''}"`;
                        if (type === 'number') return String(sample);
                        if (type === 'boolean') return String(sample);
                        if (type === 'object') return '{ ... }';
                        if (type === 'array') return '[ ... ]';
                        return JSON.stringify(sample).substring(0, 25);
                      };

                      return (
                        <button
                          class={`w-full text-left px-3 py-2 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 ${
                            index() === selectedSuggestionIndex() ? "bg-primary-500/20 autocomplete-item-selected" : ""
                          }`}
                          onClick={() => insertSourceField(field.path)}
                        >
                          <div class="flex items-start justify-between gap-2">
                            <div class="flex-1 min-w-0">
                              <code class="text-xs font-mono font-bold text-primary-400 block truncate">
                                {field.path}
                              </code>
                              <div class="flex items-center space-x-2 mt-0.5">
                                <Show when={field.type}>
                                  <span class="text-xs text-slate-500 italic">{field.type}</span>
                                </Show>
                                <Show when={field.sample !== undefined && field.sample !== null}>
                                  <span class="text-xs text-slate-600">•</span>
                                  <code class="text-xs text-slate-400 font-mono truncate">
                                    {formatSample(field.sample, field.type)}
                                  </code>
                                </Show>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    }}
                  </For>

                  {/* Add new field option */}
                  <Show when={shouldShowAddField()}>
                    <button
                      class={`w-full text-left px-3 py-2 hover:bg-white/5 transition-colors cursor-pointer text-primary-400 font-medium flex items-center space-x-2 ${
                        selectedSuggestionIndex() === filteredSuggestions().length ? "bg-primary-500/20 autocomplete-item-selected" : ""
                      }`}
                      onClick={() => addCustomField(autocomplete().searchTerm)}
                    >
                      <FiPlus class="w-4 h-4" />
                      <span>Add custom field "{autocomplete().searchTerm}"</span>
                    </button>
                  </Show>

                  {/* Empty state */}
                  <Show when={!shouldShowAddField() && filteredSuggestions().length === 0 && autocomplete().searchTerm.length === 0}>
                    <div class="px-3 py-4 text-center text-slate-400 text-xs">
                      Start typing to filter fields...
                    </div>
                  </Show>
                </div>
              </Show>
            </div>

            <div class="mt-3 pt-3 border-t border-slate-200">
              <p class="text-xs text-slate-500">
                💡 Type <kbd class="bg-slate-700 text-white px-2 py-0.5 rounded text-xs font-mono">@</kbd> to insert source fields. Variables appear as <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gradient-to-r from-primary-500 to-secondary-500 text-white">chips</span>. Click chip + press <kbd class="bg-slate-700 text-white px-1.5 py-0.5 rounded text-xs">Esc</kbd> to delete.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JsonMappingEditor;
