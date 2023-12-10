import { type SchemaTypeDefinition } from "sanity";

import project from "./schemas/project";
import sideProject from "./schemas/side-project";
import expertise from "./schemas/expertise";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [project, sideProject, expertise],
};
