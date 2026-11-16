import { Main } from "@freelensapp/extensions";

// The extension has nothing to do in the main process. The host loads the main entry that `package.json` names, so
// the entry stays.
export default class ValsMain extends Main.LensExtension {}
