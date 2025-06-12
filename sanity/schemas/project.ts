const project = {
  name: "project",
  type: "document",
  title: "Project",
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
      name: "height",
      type: "number",
      title: "Height",
    },
    {
      name: "order",
      type: "number",
      title: "Order",
      description: "Display order for this project",
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

export default project;
