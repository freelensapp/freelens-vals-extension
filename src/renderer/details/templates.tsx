import { Renderer } from "@freelensapp/extensions";
import styles from "./details.module.scss";

const {
  Component: { DrawerItem, DrawerTitle },
} = Renderer;

export interface TemplatesProps {
  templates: Record<string, string> | undefined;
}

/**
 * The templates of the keys of the `Secret`, as preformatted text.
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
        <DrawerItem key={key} name={key}>
          <pre className={styles.template}>{template}</pre>
        </DrawerItem>
      ))}
    </>
  );
}
