import type { TypedObject } from "sanity";

export default interface ISideProject {
  _id: string;
  title: string;
  description: TypedObject[];
  height: number;
  thumbnail: {
    asset: { url: string };
  };
}
