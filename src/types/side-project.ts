import { TypedObject } from "sanity";

export default interface ISideProject {
  _id: string;
  title: string;
  link: string;
  description: TypedObject[];
  shortDescription: string;
  height: number;
  thumbnail: {
    asset: { url: string };
  };
}
