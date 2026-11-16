import { Renderer } from "@freelensapp/extensions";
import styles from "./details.module.scss";

const {
  Component: { DrawerTitle, MonacoEditor },
} = Renderer;

const lineHeight = 18;

/**
 * The height of the editor for the text: one line per line of text, between 5 and 20 lines. The host's own height
 * goes up in steps of 10 lines, which leaves a short template with empty lines under it.
 */
export function getEditorHeight(text: string): number {
  const lines = text.split("\n").length;

  return Math.min(Math.max(lines, 5), 20) * lineHeight;
}

export interface TemplateEditorProps {
  template: string;
}

/**
 * A template in a read-only editor. The editor offers only YAML and JSON, and the templates are Go templates of
 * anything, so it highlights them as YAML, which most of them render.
 */
export function TemplateEditor({ template }: TemplateEditorProps) {
  return (
    <MonacoEditor
      readOnly
      language="yaml"
      className={styles.editor}
      style={{ minHeight: getEditorHeight(template) }}
      value={template}
      setInitialHeight
      options={{
        // Otherwise the wheel over the editor never scrolls the drawer, also when the editor has nothing to scroll.
        scrollbar: { alwaysConsumeMouseWheel: false },
      }}
    />
  );
}

export interface TemplatesProps {
  templates: Record<string, string> | undefined;
}

/**
 * The templates of the keys of the `Secret`, each in its own editor.
 */
export function Templates({ templates }: TemplatesProps) {
  const entries = Object.entries(templates ?? {});

  if (!entries.length) {
    return null;
  }

  return (
    <>
      <DrawerTitle>Templates</DrawerTitle>
      {entries.map(([key, template]) => (
        <div key={key} className={styles.templateItem}>
          <div className="DrawerItem">{key}</div>
          <TemplateEditor template={template} />
        </div>
      ))}
    </>
  );
}
