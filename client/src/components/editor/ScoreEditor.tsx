import React, { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState, StateField, StateEffect } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { python } from '@codemirror/lang-python';
import { keymap, Decoration, DecorationSet, WidgetType } from '@codemirror/view';
import { useScoreStore } from '../../stores/useScoreStore';
import { SyncService } from '../../services/SyncService';

interface ScoreEditorProps {
  panelId: string;
}

// Effect and Field for remote cursors
const addCursor = StateEffect.define<{ userName: string, pos: number }>();
const cursorField = StateField.define<DecorationSet>({
  create() { return Decoration.none; },
  update(cursors, tr) {
    cursors = cursors.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(addCursor)) {
        cursors = cursors.update({
          add: [cursorDecoration(e.value.userName).range(e.value.pos)]
        });
      }
    }
    return cursors;
  },
  provide: f => EditorView.decorations.from(f)
});

class CursorWidget extends WidgetType {
  constructor(readonly name: string) { super(); }
  toDOM() {
    const span = document.createElement("span");
    span.className = "remote-cursor";
    span.style.borderLeft = "2px solid #8cf5a8";
    span.style.position = "relative";
    
    const label = document.createElement("div");
    label.className = "remote-cursor-label";
    label.textContent = this.name;
    label.style.position = "absolute";
    label.style.top = "-15px";
    label.style.left = "0";
    label.style.background = "#8cf5a8";
    label.style.color = "#000";
    label.style.fontSize = "9px";
    label.style.padding = "1px 3px";
    label.style.whiteSpace = "nowrap";
    label.style.borderRadius = "2px";
    label.style.zIndex = "10";
    
    span.appendChild(label);
    return span;
  }
}

const cursorDecoration = (name: string) => Decoration.widget({
  widget: new CursorWidget(name),
  side: 1
});

export const ScoreEditor: React.FC<ScoreEditorProps> = ({ panelId }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { panels, updatePanelText } = useScoreStore();
  const sync = SyncService.getInstance();
  const initialText = panels[panelId]?.text || '';

  const saveScore = async (text: string) => {
    const meta = panels[panelId];
    if (!meta?.id) return;
    try {
      await fetch(`/api/scores/${meta.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
    } catch (e) { console.error('Save failed:', e); }
  };

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: initialText,
      extensions: [
        basicSetup,
        oneDark,
        python(),
        cursorField,
        keymap.of([{
          key: 'Mod-Enter',
          run: (view) => { saveScore(view.state.doc.toString()); return true; }
        }]),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const nextText = update.state.doc.toString();
            updatePanelText(panelId, nextText);
            sync.broadcastText(panelId, nextText);
          }
          if (update.selectionSet) {
            const pos = update.state.selection.main.head;
            const line = update.state.doc.lineAt(pos);
            sync.broadcastCursor(panelId, line.number, pos - line.from);
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: editorRef.current });
    viewRef.current = view;

    // Register remote callbacks
    sync.setCallbacks({
      onPeersUpdate: (peers) => {
        if (!viewRef.current) return;
        // Clean and update remote cursors (Simplified for demo)
        peers.forEach(peer => {
          if (peer.cursor) {
            try {
              const line = viewRef.current!.state.doc.line(peer.cursor.line);
              const pos = Math.min(line.from + peer.cursor.ch, line.to);
              viewRef.current!.dispatch({ effects: addCursor.of({ userName: peer.userName, pos }) });
            } catch (e) {}
          }
        });
      },
      onRemoteTextChange: (id, text) => {
        if (id === panelId && viewRef.current && text !== viewRef.current.state.doc.toString()) {
          viewRef.current.dispatch({
            changes: { from: 0, to: viewRef.current.state.doc.length, insert: text }
          });
        }
      }
    });

    return () => view.destroy();
  }, []);

  return <div ref={editorRef} style={{ height: '100%', width: '100%', overflow: 'hidden' }} />;
};
