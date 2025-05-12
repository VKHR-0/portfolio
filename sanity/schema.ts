import { type SchemaTypeDefinition } from "sanity";

import project from "./schemas/project";
import sideProject from "./schemas/side-project";
import expertise from "./schemas/expertise";
import skill from "./schemas/skill";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [project, sideProject, expertise, skill],
};
