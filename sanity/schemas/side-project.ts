const sideProject = {
  name: "sideProject",
  type: "document",
  title: "Side Project",
  fields: [
    {
      name: "thumbnail",
      type: "image",
      title: "Thumbnail",
    },
    {
      name: "title",
      type: "string",
      title: "Title",
    },
    {
      name: "link",
      type: "string",
      title: "Link",
    },
    {
      name: "height",
      type: "number",
      title: "Height",
    },
    {
      name: "shortDescription",
      type: "string",
      title: "Short Description",
    },
    {
      name: "description",
      title: "Description",
      type: "array",
      of: [
        { type: "block" },
        {
          type: "image",
          fields: [
            {
              type: "text",
              name: "alt",
              title: "Alternative text",
              description: `Some of your visitors cannot see images, 
            be they blind, color-blind, low-sighted; 
            alternative text is of great help for those 
            people that can rely on it to have a good idea of 
            what\'s on your page.`,
            },
          ],
        },
      ],
    },
  ],
};

export default sideProject;
