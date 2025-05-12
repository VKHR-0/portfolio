const skill = {
  name: "skill",
  type: "document",
  title: "Skill",
  fields: [
    {
      name: "title",
      type: "string",
      title: "Title",
      description: "Skill category like 'Frontend', 'Backend', etc.",
    },
    {
      name: "description",
      title: "Description",
      type: "array",
      of: [{ type: "block" }],
      description: "A brief description of this skill category",
    },
    {
      name: "order",
      type: "number",
      title: "Order",
      description: "Display order for this skill category",
    },
    {
      name: "badges",
      title: "Technology Badges",
      type: "array",
      of: [
        {
          type: "object",
          name: "badge",
          fields: [
            {
              name: "technology",
              type: "string",
              title: "Technology",
              description: "Technology name like 'React', 'Next.js', etc.",
            },
          ],
        },
      ],
      description: "List of technologies associated with this skill category",
    },
  ],
};

export default skill;
